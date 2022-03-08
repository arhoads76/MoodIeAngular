import { Component, Injectable, Input, OnInit, OnChanges } from '@angular/core';
import { Game, Letter, RowStates, MaxGuesses, LetterClues, GameState, GameStates } from './GameState';

function makeBoardRows(game : Game) : Array<Array<Letter>> {
	var boardRows	= Array<Array<Letter>>();
	var state		= game.state;

	for (var i = 0; i < MaxGuesses; i++) {
		if (i < state.activeRow) {
			var row = Array<Letter>();
			for (var j = 0; j < state.wordLength; j++)
				row.push(state.rows[i].letters[j]);
			boardRows.push(row);
		} else if (i == state.activeRow) {
			var activeRow = state.rows[state.activeRow];
			var row = Array<Letter>();
			for (var j = 0; j < state.wordLength; j++) {
				if (j < activeRow.letters.length)
					row.push(activeRow.letters[j]);
				else
					row.push({ } as Letter);
			}
			boardRows.push(row);
		} else {
			var row = Array<Letter>();
			for (var j = 0; j < state.wordLength; j++)
				row.push({ } as Letter);
			boardRows.push(row);
		}
	}

	return boardRows;
}

@Component({
  selector: 'app-game-board',
  templateUrl: './app.gameBoard.html',
})
@Injectable()
export class GameBoard implements OnInit, OnChanges {
	@Input() game? : Game
	@Input() gameState? : GameState

	boardRows = Array<Array<Letter>>();

	animateLetter : number = -1;
	animateInterval : any = undefined;

	ngOnInit() {
		if (this.game)
			this.boardRows = makeBoardRows(this.game);
	}
	ngOnChanges() {
		if (this.game) {
			this.boardRows = makeBoardRows(this.game);

			if (this.game.state.gameState == GameStates.Scoring && this.animateInterval == undefined) {
				this.animateLetter = 0;
				this.animateInterval = setInterval(this.updateAnimatedLetter.bind(this), 500);
			}
		}
	}

	updateAnimatedLetter() {
		if (this.game) {
			if (this.animateLetter < this.game.state.wordLength) {
				this.animateLetter++;
			} else {
				clearInterval(this.animateInterval);
				this.animateInterval = undefined;
				this.animateLetter = -1;
				this.game.onScoringCompleted();
			}
		}
	}

	isActiveRow(i : number) : boolean {
		return !!this.game && i == this.game.state.activeRow;
	}
	isInvalidWord(i : number) : boolean {
		var isInvalid = false;

		if (this.game && this.isActiveRow(i)) {
			var activeRow = this.game.state.rows[i];
			if (activeRow.letters.length == this.game.state.wordLength)
				isInvalid = !activeRow.isValidWord;
		}

		return isInvalid;
	}
	isAnimatingLetter(j : number) : boolean {
		return false;
	}
	isCorrect(i : number, j : number) : boolean {
		if (this.game && this.game.state.rows[i] && this.game.state.rows[i].letters[j]) {
			var letter = this.game.state.rows[i].letters[j];
			var rowState = this.game.state.rows[i].rowState;
			return (rowState == RowStates.Locked || rowState == RowStates.Pending) && letter.clue == LetterClues.Correct;
		}
		return false;
	}
	isElsewhere(i : number, j : number) : boolean {
		if (this.game && this.game.state.rows[i] && this.game.state.rows[i].letters[j]) {
			var letter = this.game.state.rows[i].letters[j];
			var rowState = this.game.state.rows[i].rowState;
			return (rowState == RowStates.Locked || rowState == RowStates.Pending) && letter.clue == LetterClues.Elsewhere;
		}
		return false;
	}
	isAbsent(i : number, j : number) : boolean {
		if (this.game && this.game.state.rows[i] && this.game.state.rows[i].letters[j]) {
			var letter = this.game.state.rows[i].letters[j];
			var rowState = this.game.state.rows[i].rowState;
			return (rowState == RowStates.Locked || rowState == RowStates.Pending) && letter.clue == LetterClues.Absent;
		}
		return false;
	}
}
