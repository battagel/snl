"""Tests for the Snakes and Ladders engine, mapped to the spec in snl.py."""

# Tests inspect Game._current_player directly; it is deliberately private in the engine.
# pylint: disable=protected-access,redefined-outer-name
# pyright: reportPrivateUsage=false

import contextlib
import os
from collections import Counter
from time import perf_counter

import pytest

from python.snl import Board, Dice, Game, Player


class FixedDice:
    """Deterministic stand-in for Dice: returns the given rolls in order."""

    def __init__(self, *rolls: int):
        self._rolls = list(rolls)

    def roll(self) -> int:
        if not self._rolls:
            raise AssertionError("Dice rolled more times than the test expected")
        return self._rolls.pop(0)

    @property
    def remaining(self) -> int:
        return len(self._rolls)


@pytest.fixture
def player1() -> Player:
    return Player("Player1")


@pytest.fixture
def player2() -> Player:
    return Player("Player2")


@pytest.fixture
def make_game(player1, player2):
    """Build a 100-square, two-player game that will roll the given values."""

    def _make(*rolls: int) -> Game:
        return Game(Board(100), [player1, player2], FixedDice(*rolls))

    return _make


# Feature 1: Starting & Moving


def test_1_1_new_game_starts_with_both_players_on_square_1(make_game, player1, player2):
    game = make_game()

    assert player1.position == 1
    assert player2.position == 1
    assert game._current_player is player1


def test_1_2_rolling_a_4_from_square_1_lands_on_square_5(make_game, player1):
    game = make_game(4)

    game.take_turn()

    assert player1.position == 5


def test_1_3_rolling_3_then_4_from_square_1_lands_on_square_8(player1):
    # Player 1 plays alone so both rolls are theirs, independent of turn order (Feature 3).
    game = Game(Board(100), [player1], FixedDice(3, 4))

    game.take_turn()  # P1: 1 -> 4
    game.take_turn()  # P1: 4 -> 8

    assert player1.position == 8


# Feature 2: Winning the Game


def test_2_1_exact_roll_to_100_wins(make_game, player1):
    game = make_game(3)
    player1.position = 97

    game.take_turn()

    assert player1.position == 100
    assert game.winner is player1


def test_2_2_overshooting_100_bounces_back(make_game, player1):
    game = make_game(4)
    player1.position = 97

    game.take_turn()  # 97 + 4 = 101 -> 1 too many -> 99

    assert player1.position == 99
    assert game.winner is None


def test_2_3_no_turns_after_game_is_won(player1, player2):
    dice = FixedDice(3, 5, 5)
    game = Game(Board(100), [player1, player2], dice)
    player1.position = 97

    game.take_turn()  # P1 wins
    assert game.winner is player1

    game.take_turn()  # should be ignored
    game.take_turn()

    assert player1.position == 100
    assert player2.position == 1
    assert game.winner is player1
    assert dice.remaining == 2, "Dice should not be rolled once the game is over"


# Feature 3: Turns & Multiple Players


def test_3_1_after_player_1_rolls_it_is_player_2s_turn(make_game, player2):
    game = make_game(2)

    game.take_turn()

    assert game._current_player is player2


def test_3_2_after_player_2_rolls_turn_cycles_back_to_player_1(make_game, player1):
    game = make_game(2, 3)

    game.take_turn()  # P1
    game.take_turn()  # P2

    assert game._current_player is player1


def test_3_3_players_track_positions_independently(make_game, player1, player2):
    game = make_game(3, 5)

    game.take_turn()  # P1 rolls 3

    assert player1.position == 4
    assert player2.position == 1

    game.take_turn()  # P2 rolls 5

    assert player1.position == 4
    assert player2.position == 6



def test_performance(capsys):
    games = 100_000
    start = perf_counter()
    winner_counts = Counter()
    with open(os.devnull, "w", encoding="utf-8") as devnull, contextlib.redirect_stdout(devnull):
        for _ in range(games):
            game = Game(Board(100), [Player("Player1"), Player("Player2")], Dice(6))
            winner = game.play()
            winner_counts[winner.name] += 1

    with capsys.disabled():
        print(f"\n{winner_counts}")
        print(f"{perf_counter() - start:.2f}s")

    assert sum(winner_counts.values()) == games
    assert set(winner_counts) == {"Player1", "Player2"}
