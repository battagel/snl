# Build the core engine for a Snakes and Ladders board game. You do not need a UI; focus entirely on the domain logic and state transitions.
# General Rules
# The board has 100 squares, starting at 1 and ending at 100.
# Players take turns rolling a 6-sided die (numbered 1–6).
# A player must land exactly on square 100 to win.

# Feature 1: Starting & Moving
# Focus on basic player setup and basic movements without any obstacles.
# Test 1.1: A new game starts with Player 1 and Player 2 on Square 1.
# Test 1.2: Given Player 1 is on Square 1, when they roll a 4, they should land on Square 5.
# Test 1.3: Given Player 1 is on Square 1, when they roll a 3 and then a 4, they should land on Square 8.

# Feature 2: Winning the Game
# Handle the end-game condition and exact roll rules.
# Test 2.1: Given Player 1 is on Square 97, when they roll a 3, they land on Square 100 and the game declares Player 1 wins.
# Test 2.2: Given Player 1 is on Square 97, when they roll a 4, they bounce off the end and land back on Square 99 (100 minus the remaining moves).
# Test 2.3: Given a player has won, any further rolls or turns are ignored / not allowed.
# Feature 3: Turns & Multiple Players
# Manage the flow of the game between players.
# Test 3.1: After Player 1 rolls, it is Player 2's turn.
# Test 3.2: After Player 2 rolls, the turn cycles back to Player 1.
# Test 3.3: Ensure players track their positions independently (e.g., Player 1 rolling a 3 doesn't affect Player 2's position).
 
# There is also a Feature 4, but this is to be done in the interview itself is to implement as mentioned, so we’d expect the code only to cover the first 3 features.

# This is not intended to be a task that deals with complex UI or design, it is more the core engine and logic that’s important. We are leaving the implementation design completely up to you on how you approach the problem. 

import sys
import random

BOARD_SIZE = 100
BOARD_START = 1
DICE_SIDES = 6

class Player:

    def __init__(self, name: str):
        self.name: str = name
        self.position: int = BOARD_START

class Board:

    def __init__(self, size: int):
        self.size: int = size

class Dice:

    def __init__(self, sides: int):
        self._sides: int = sides

    def roll(self) -> int:
        return random.randint(1, self._sides)


class Game:

    def __init__(self, board: Board, players: list[Player], dice: Dice):
        self._board = board
        self._players = players
        self._dice = dice

        if not players:
            raise ValueError("No players given")

        self._current_player = self._players[0]
        self._winner: Player | None = None

    @property
    def winner(self) -> Player | None:
        return self._winner

    def _move_current_player(self, roll: int):
        new_position: int = self._current_player.position + roll
        if new_position > self._board.size:
            print(f"Overshoot! {new_position}")
            new_position = self._board.size - (new_position - self._board.size)
        self._current_player.position = new_position

    def _check_win_condition(self) -> bool:
        return self._current_player.position == self._board.size

    def take_turn(self):
        if self.winner is not None:
            print(f"The game has already been won by {self.winner.name}")
            return
        print(f"Player: {self._current_player.name}'s go!")
        print(f"Start position: {self._current_player.position}")
        roll = self._dice.roll()
        print(f"Rolled: {roll}")
        self._move_current_player(roll)
        print(f"Finish position: {self._current_player.position}")
        print()
        if self._check_win_condition():
            self._winner = self._current_player

    def play(self) -> Player:
        print("Game start!")
        print("-----------")
        while self._winner is None:
            self.take_turn()
        return self._winner


def main() -> int:

    board = Board(BOARD_SIZE)

    dice = Dice(DICE_SIDES)

    player1 = Player("Player1")
    player2 = Player("Player2")
    players = [player1, player2]

    game = Game(board, players, dice)
    winning_player = game.play()

    print(f"And the winner is: {winning_player.name}")

    return 0

if __name__ == "__main__":
    sys.exit(main())
