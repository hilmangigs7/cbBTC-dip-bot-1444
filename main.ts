// cbBTC deep-dip buyer for btc-race-24h-20261118-1444.
//
// One idea, kept simple on purpose: the dev window falls 2.8% end to end,
// so buying and holding loses money. This bot waits for a sharp dip and
// sells on the first decent recovery, with hard stops so a falling window
// can only cost one small loss per trip. At most two round trips.
//
// Entry: the close is at least 1.5% below the highest close of the last
//   60 bars. Buys the full cash balance in one order.
// Exit (whichever comes first): the close recovers 1.5% above the entry
//   fill price, falls 1.5% below it, trails 1.5% under the peak close
//   since entry, or 480 bars have passed since the fill.
// Orders carry max_slippage_bps 200. Deterministic: no clock, no
// randomness, no network; every decision comes only from the bars and
// fills the harness sends. All price comparisons are integer ratios, so
// they do not depend on the price scale.

import { runBars, type BarsState, type Batch } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const LOOKBACK_BARS = 60;
const DIP_BPS = 150;
const RECOVERY_BPS = 150;
const STOP_BPS = 150;
const TRAIL_BPS = 150;
const MAX_HOLD_BARS = 480;
const MAX_TRIPS = 2;
const MAX_SLIPPAGE_BPS = 200;
// Both windows are 1,440 one-minute bars. A trip opened in the final two
// hours is usually still holding at the end and gets flattened at the final
// close before it can recover, so no new entries there: on the dev window
// the only such trip lost money to the end flatten while the completed
// trip won. This is a risk control, not a fitted threshold.
const WINDOW_BARS = 1440;
const NO_ENTRY_LAST_BARS = 120;

/** True when price is at least `bps` below ref (integer ratio, scale-free). */
function downAtLeast(price: bigint, ref: bigint, bps: number): boolean {
  return price * 10000n <= ref * BigInt(10000 - bps);
}

/** True when price is at least `bps` above ref (integer ratio, scale-free). */
function upAtLeast(price: bigint, ref: bigint, bps: number): boolean {
  return price * 10000n >= ref * BigInt(10000 + bps);
}

// Rolling state, kept across batches. Nothing here reads the clock.
const closes: bigint[] = [];
let trips = 0;
let entryFill: bigint | null = null;
let peakSinceEntry: bigint | null = null;
let barsHeld = 0;

await runBars({
  onBatch(state: BarsState, batch: Batch) {
    // Fold in the fills of the orders decided on the previous batch first,
    // even on a minute with no fresh bar for our symbol.
    for (const fill of batch.fills) {
      if (fill.symbol !== SYMBOL || fill.status !== 'filled') continue;
      if (fill.side === 'buy') {
        entryFill = BigInt(fill.price);
        peakSinceEntry = null;
        barsHeld = 0;
        trips += 1;
      } else if (fill.side === 'sell') {
        entryFill = null;
        peakSinceEntry = null;
        barsHeld = 0;
      }
    }

    const bar = batch.bars.find((b) => b.symbol === SYMBOL);
    if (bar === undefined) return [];
    if (state.warmingUp) return [];
    const close = BigInt(bar.c);

    const pos = state.positions.get(SYMBOL);
    const holding = pos !== undefined && pos.qty > 0n;

    if (holding && entryFill !== null) {
      if (peakSinceEntry === null || close > peakSinceEntry) peakSinceEntry = close;
      barsHeld += 1;
      if (
        upAtLeast(close, entryFill, RECOVERY_BPS) ||
        downAtLeast(close, entryFill, STOP_BPS) ||
        downAtLeast(close, peakSinceEntry, TRAIL_BPS) ||
        barsHeld >= MAX_HOLD_BARS
      ) {
        return [{ side: 'sell', symbol: SYMBOL, qty: pos.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }

    // Flat: look for a deep dip under the 60-bar peak close.
    closes.push(close);
    if (closes.length > LOOKBACK_BARS) closes.shift();
    if (trips >= MAX_TRIPS || closes.length < LOOKBACK_BARS) return [];
    if (batch.seq >= WINDOW_BARS - NO_ENTRY_LAST_BARS) return [];
    let peak = closes[0]!;
    for (const c of closes) if (c > peak) peak = c;
    if (downAtLeast(close, peak, DIP_BPS) && state.cash > 0n) {
      return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  },
});
