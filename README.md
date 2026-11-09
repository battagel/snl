# Snakes and Ladders

The core engine for a Snakes and Ladders game: players, board, dice, turns and winning. It has no UI.

It was written first in **Python**, then **transpiled into TypeScript using AI**. The TypeScript follows the Python as closely as possible, and its docstrings note where it differs.

The brief is the comment block at the top of `snl.py`. Each feature in it has a matching test.

## Python

Requires Python 3.10+ and pytest. Run from the repo root:

```sh
python3 python/snl.py                       # play a game
python3 -m pytest python/test_snl.py        # run the tests
```

## TypeScript

Requires Node 24.2+. It runs `.ts` files directly, so there is no build step.

```sh
cd typescript
npm install
npm start            # play a game
npm test             # run the tests
npm run typecheck    # type-check with tsc
```
