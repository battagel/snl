// Build the core engine for a Snakes and Ladders board game. You do not need a UI; focus entirely on the domain logic and state transitions.
// General Rules
// The board has 100 squares, starting at 1 and ending at 100.
// Players take turns rolling a 6-sided die (numbered 1–6).
// A player must land exactly on square 100 to win.

// Feature 1: Starting & Moving
// Focus on basic player setup and basic movements without any obstacles.
// Test 1.1: A new game starts with Player 1 and Player 2 on Square 1.
// Test 1.2: Given Player 1 is on Square 1, when they roll a 4, they should land on Square 5.
// Test 1.3: Given Player 1 is on Square 1, when they roll a 3 and then a 4, they should land on Square 8.

// Feature 2: Winning the Game
// Handle the end-game condition and exact roll rules.
// Test 2.1: Given Player 1 is on Square 97, when they roll a 3, they land on Square 100 and the game declares Player 1 wins.
// Test 2.2: Given Player 1 is on Square 97, when they roll a 4, they bounce off the end and land back on Square 99 (100 minus the remaining moves).
// Test 2.3: Given a player has won, any further rolls or turns are ignored / not allowed.
// Feature 3: Turns & Multiple Players
// Manage the flow of the game between players.
// Test 3.1: After Player 1 rolls, it is Player 2's turn.
// Test 3.2: After Player 2 rolls, the turn cycles back to Player 1.
// Test 3.3: Ensure players track their positions independently (e.g., Player 1 rolling a 3 doesn't affect Player 2's position).

// There is also a Feature 4, but this is to be done in the interview itself is to implement as mentioned, so we’d expect the code only to cover the first 3 features.

// This is not intended to be a task that deals with complex UI or design, it is more the core engine and logic that’s important. We are leaving the implementation design completely up to you on how you approach the problem. 

/**
 * TypeScript transpilation of python/snl.py (Step 3), kept as close to the Python as possible.
 *
 * Divergences from Python that apply throughout:
 * - Naming follows TypeScript convention: snake_case becomes camelCase
 *   (take_turn -> takeTurn, _current_player -> _currentPlayer). The leading underscore is kept
 *   on private members to mirror Python and to avoid clashing with the `winner` getter.
 * - Python's `_name` privacy is a convention; here members are also marked `private`, which the
 *   compiler enforces (at compile time only; it is still a plain property at runtime).
 * - Python declares attributes by assigning them in __init__; TypeScript declares each field with
 *   its type on the class first. Parameter properties (`constructor(private x)`) are avoided so
 *   the file stays erasable and runs directly with `node snl.ts`.
 * - `int` becomes `number`; TypeScript has no separate integer type.
 * - `X | None` becomes `X | null`.
 * - `print()` becomes `console.log()`.
 * - Python exports every top-level name implicitly; here they are exported explicitly.
 */

import random from "random";

export const BOARD_SIZE = 100;
export const BOARD_START = 1;
export const DICE_SIDES = 6;

export class Player {
    name: string;
    position: number;

    constructor(name: string) {
        this.name = name;
        this.position = BOARD_START;
    }
}

export class Board {
    size: number;

    constructor(size: number) {
        this.size = size;
    }
}

export class Dice {
    private _sides: number;

    constructor(sides: number) {
        this._sides = sides;
    }

    /**
     * Divergence: Python's built-in `random.randint` becomes `random.int` from the `random` npm
     * package. Both include both ends, so the result is in 1..sides.
     */
    roll(): number {
        return random.int(1, this._sides);
    }
}


export class Game {
    private _board: Board;
    private _players: Player[];
    private _dice: Pick<Dice, "roll">;
    private _currentPlayer: Player;
    private _winner: Player | null;

    /**
     * Divergences:
     * - `dice` is typed `Pick<Dice, "roll">` rather than `Dice`. TypeScript compares classes by
     *   shape, but a class with private fields (`Dice._sides`) only accepts real instances, so
     *   the tests' FixedDice would be rejected. Python's duck typing has no such issue.
     * - `ValueError` becomes `Error`; JavaScript has no built-in ValueError.
     * - `if not players` becomes an explicit length check, since an empty array is truthy in JS.
     */
    constructor(board: Board, players: Player[], dice: Pick<Dice, "roll">) {
        this._board = board;
        this._players = players;
        this._dice = dice;

        if (players.length === 0) {
            throw new Error("No players given");
        }

        this._currentPlayer = this._players[0];
        this._winner = null;
    }

    /** Divergence: `@property` becomes a `get` accessor. */
    get winner(): Player | null {
        return this._winner;
    }

    /** Divergence: `list.index()` becomes `Array.indexOf()`. */
    private _nextPlayer(): void {
        const currentIndex = this._players.indexOf(this._currentPlayer);
        const nextIndex = (currentIndex + 1) % this._players.length;
        this._currentPlayer = this._players[nextIndex];
    }

    private _moveCurrentPlayer(roll: number): void {
        let newPosition: number = this._currentPlayer.position + roll;
        if (newPosition > this._board.size) {
            console.log(`Overshoot! ${newPosition}`);
            newPosition = this._board.size - (newPosition - this._board.size);
        }
        this._currentPlayer.position = newPosition;
    }

    private _checkWinCondition(): boolean {
        return this._currentPlayer.position === this._board.size;
    }

    takeTurn(): void {
        if (this.winner !== null) {
            console.log(`The game has already been won by ${this.winner.name}`);
            return;
        }
        console.log(`Player: ${this._currentPlayer.name}'s go!`);
        console.log(`Start position: ${this._currentPlayer.position}`);
        const roll = this._dice.roll();
        console.log(`Rolled: ${roll}`);
        this._moveCurrentPlayer(roll);
        console.log(`Finish position: ${this._currentPlayer.position}`);
        console.log();
        if (this._checkWinCondition()) {
            this._winner = this._currentPlayer;
            return;
        }
        this._nextPlayer();
    }

    play(): Player {
        console.log("Game start!");
        console.log("-----------");
        while (this._winner === null) {
            this.takeTurn();
        }
        return this._winner;
    }
}


/**
 * Divergence: shuffling uses the `random` npm package, because JavaScript has no
 * `random.shuffle`. Unlike Python's, which changes the list in place and returns None, its
 * `random.shuffle()` returns a shuffled copy, so the result is assigned to `players`.
 */
export function main(): number {

    const board = new Board(BOARD_SIZE);

    const dice = new Dice(DICE_SIDES);

    const player1 = new Player("Player1");
    const player2 = new Player("Player2");
    const players = random.shuffle([player1, player2]); // Avoid player1s advantage

    const game = new Game(board, players, dice);
    const winningPlayer = game.play();

    console.log(`And the winner is: ${winningPlayer.name}`);

    return 0;
}

/**
 * Divergences:
 * - `if __name__ == "__main__"` becomes `import.meta.main` (Node 24.2+).
 * - `sys.exit(code)` becomes setting `process.exitCode`, which lets Node exit normally with that
 *   code instead of stopping immediately.
 */
if (import.meta.main) {
    process.exitCode = main();
}
