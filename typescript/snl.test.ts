/**
 * Tests for the Snakes and Ladders engine, mapped to the spec in snl.ts.
 * Transpiled from python/test_snl.py.
 *
 * Divergences from Python:
 * - pytest becomes Node's built-in `node:test` and `node:assert/strict`, so no dependencies.
 * - pytest fixtures (player1, player2, make_game) become a `setup()` helper that each test
 *   calls, which gives the same fresh players and game per test.
 * - Python reads the private `game._current_player` after a pylint/pyright disable. TypeScript
 *   rejects `game._currentPlayer` for a `private` member, but deliberately allows bracket
 *   access `game["_currentPlayer"]`, so that is the explicit opt-in here.
 * - `assert a is b` becomes `assert.strictEqual(a, b)`. For objects `===` compares identity,
 *   the same as Python's `is`.
 * - pytest captures `print` output and only shows it for failing tests. `node:test` shows it all,
 *   so the engine's output appears in the test report.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { Board, Dice, Game, Player } from "./snl.ts";


/** Deterministic stand-in for Dice: returns the given rolls in order. */
class FixedDice {
    private _rolls: number[];

    /** Divergence: `*rolls` becomes the rest parameter `...rolls`. */
    constructor(...rolls: number[]) {
        this._rolls = [...rolls];
    }

    /**
     * Divergences:
     * - Python's `AssertionError` becomes `assert.AssertionError`, so the failure is reported as
     *   an assertion failure.
     * - `list.pop(0)` becomes `Array.shift()`.
     */
    roll(): number {
        const next = this._rolls.shift();
        if (next === undefined) {
            throw new assert.AssertionError({ message: "Dice rolled more times than the test expected" });
        }
        return next;
    }

    get remaining(): number {
        return this._rolls.length;
    }
}


/** Replaces the pytest fixtures player1, player2 and make_game. */
function setup() {
    const player1 = new Player("Player1");
    const player2 = new Player("Player2");
    /** Build a 100-square, two-player game that will roll the given values. */
    const makeGame = (...rolls: number[]): Game =>
        new Game(new Board(100), [player1, player2], new FixedDice(...rolls));
    return { player1, player2, makeGame };
}


// Feature 1: Starting & Moving


test("1.1 new game starts with both players on square 1", () => {
    const { player1, player2, makeGame } = setup();
    const game = makeGame();

    assert.equal(player1.position, 1);
    assert.equal(player2.position, 1);
    assert.strictEqual(game["_currentPlayer"], player1);
});


test("1.2 rolling a 4 from square 1 lands on square 5", () => {
    const { player1, makeGame } = setup();
    const game = makeGame(4);

    game.takeTurn();

    assert.equal(player1.position, 5);
});


test("1.3 rolling 3 then 4 from square 1 lands on square 8", () => {
    const { player1 } = setup();
    // Player 1 plays alone so both rolls are theirs, independent of turn order (Feature 3).
    const game = new Game(new Board(100), [player1], new FixedDice(3, 4));

    game.takeTurn(); // P1: 1 -> 4
    game.takeTurn(); // P1: 4 -> 8

    assert.equal(player1.position, 8);
});


// Feature 2: Winning the Game


test("2.1 exact roll to 100 wins", () => {
    const { player1, makeGame } = setup();
    const game = makeGame(3);
    player1.position = 97;

    game.takeTurn();

    assert.equal(player1.position, 100);
    assert.strictEqual(game.winner, player1);
});


test("2.2 overshooting 100 bounces back", () => {
    const { player1, makeGame } = setup();
    const game = makeGame(4);
    player1.position = 97;

    game.takeTurn(); // 97 + 4 = 101 -> 1 too many -> 99

    assert.equal(player1.position, 99);
    assert.equal(game.winner, null);
});


test("2.3 no turns after game is won", () => {
    const { player1, player2 } = setup();
    const dice = new FixedDice(3, 5, 5);
    const game = new Game(new Board(100), [player1, player2], dice);
    player1.position = 97;

    game.takeTurn(); // P1 wins
    assert.strictEqual(game.winner, player1);

    game.takeTurn(); // should be ignored
    game.takeTurn();

    assert.equal(player1.position, 100);
    assert.equal(player2.position, 1);
    assert.strictEqual(game.winner, player1);
    assert.equal(dice.remaining, 2, "Dice should not be rolled once the game is over");
});


// Feature 3: Turns & Multiple Players


test("3.1 after player 1 rolls it is player 2's turn", () => {
    const { player2, makeGame } = setup();
    const game = makeGame(2);

    game.takeTurn();

    assert.strictEqual(game["_currentPlayer"], player2);
});


test("3.2 after player 2 rolls turn cycles back to player 1", () => {
    const { player1, makeGame } = setup();
    const game = makeGame(2, 3);

    game.takeTurn(); // P1
    game.takeTurn(); // P2

    assert.strictEqual(game["_currentPlayer"], player1);
});


test("3.3 players track positions independently", () => {
    const { player1, player2, makeGame } = setup();
    const game = makeGame(3, 5);

    game.takeTurn(); // P1 rolls 3

    assert.equal(player1.position, 4);
    assert.equal(player2.position, 1);

    game.takeTurn(); // P2 rolls 5

    assert.equal(player1.position, 4);
    assert.equal(player2.position, 6);
});


/**
 * Divergences:
 * - `collections.Counter` becomes a `Map<string, number>` with an explicit default of 0.
 * - `time.perf_counter()` (seconds) becomes `performance.now()` (milliseconds).
 * - `redirect_stdout(devnull)` becomes temporarily replacing `console.log` with a no-op.
 *   Restoring it before printing the summary does the job of `capsys.disabled()`. node:test's
 *   `t.mock.method` isn't used: it records every call, and millions of calls run out of memory.
 */
test("performance", () => {
    const games = 100_000;
    const start = performance.now();
    const winnerCounts = new Map<string, number>();
    const originalLog = console.log;
    console.log = () => {};
    try {
        for (let i = 0; i < games; i++) {
            const game = new Game(new Board(100), [new Player("Player1"), new Player("Player2")], new Dice(6));
            const winner = game.play();
            winnerCounts.set(winner.name, (winnerCounts.get(winner.name) ?? 0) + 1);
        }
    } finally {
        console.log = originalLog;
    }

    console.log(`\n${JSON.stringify(Object.fromEntries(winnerCounts))}`);
    console.log(`${((performance.now() - start) / 1000).toFixed(2)}s`);

    const total = [...winnerCounts.values()].reduce((sum, count) => sum + count, 0);
    assert.equal(total, games);
    assert.deepEqual(new Set(winnerCounts.keys()), new Set(["Player1", "Player2"]));
});
