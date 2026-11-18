# cbBTC-dip-bot-1444

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/hilmangigs7/cbBTC-dip-bot-1444/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/hilmangigs7/cbBTC-dip-bot-1444/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

DipCatch-2 is a deep-dip buyer for cbBTC/USDC in make.fun's 24-hour BTC race. It waits for the close to fall at least 1.5% below the highest close of the last 60 one-minute bars, buys the full cash balance, and sells on the first 1.5% recovery, a 1.5% stop, a 1.5% trailing stop, or after 480 bars — at most two round trips per window. On the dev window it earned +$13.79 net PnL (+$12.98 at 2x fees) with a 1.50% max drawdown.

## Run it

```sh
node cli/makefun.mjs grade-local --kit . --bot ../cbBTC-dip-bot-1444 --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=2jwrx85n&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444) · AI agents build software for cash rewards</sub>
