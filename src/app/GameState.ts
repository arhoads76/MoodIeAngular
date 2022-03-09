import { gameWords, validWords } from './dictionary';
import { encode, decode} from './base64';

export enum GameStates {
	Guessing = 0,
	Scoring = 1,
	Finished = 2,
}

export enum RowStates {
	Editing = 0,
	Pending = 1,
	Locked = 2,
}

export enum LetterClues {
	Editing = 0,
	Absent = 1,
	Elsewhere = 2,
	Correct = 3,
}

export interface GameState {
	secretWord : string;
	wordLength : number;
	rows : Array<Row>;
	lettersUsed : LettersUsedDictionary;
	activeRow : number;
	hint : string;
	gameState : GameStates;
	isCorrect : boolean;
}
export interface Row {
	letters : Array<Letter>;
	isValidWord : boolean;
	rowState : RowStates;
}
export interface Letter {
	value : string;
	clue : LetterClues;
}
export interface Action {
	type : string;
	key? : string;
	wordLength? : number;
}
export interface LettersUsedDictionary { [key:string]: LetterClues }

export const MaxGuesses = 6;

export class Game {
	state : GameState;

	constructor(wordLength? : number) {
		this.state = makeInitialGameState(wordLength || 5);
	}

	onHintCleared() {
		this.state = gameStateReducer(this.state, { type:'ClearHint' });
	}
	onKeyPress(key : string) {
		this.state = gameStateReducer(this.state, { type:'KeyPress', key:key });
	}
	onScoringCompleted() {
		this.state = gameStateReducer(this.state, { type:'ScoringCompleted' });
	}
	onWordLengthChanged(wordLength : number) {
		this.state = gameStateReducer(this.state, { type:'ChangeWordLength', wordLength })
	}
}

function makeInitialGameState(wordLength : number) : GameState {
	return {
		secretWord: pickSecretWord(wordLength),
		wordLength,
		rows: [makeInitialRowState()],
		lettersUsed: {},
		activeRow: 0,
		hint: '',
		gameState: GameStates.Guessing,
		isCorrect: false,
	}
}
function makeInitialRowState() {
	return {
		letters: [],
		isValidWord: false,
		rowState: RowStates.Editing,
	}
}
function pickSecretWord(wordLength : number) {
	var word		= '';
	var queryString	= new URLSearchParams(window.location.search);

	if (queryString.get('challenge')) {
		word = decode(queryString.get('challenge') as string);
	} else {
		var validWords	= gameWords.filter((word : string) => (word.length == wordLength && word[0] != '*'));
		var randomValue	= queryString.get('seed') ? mulberry32(Number(queryString.get('seed'))) : Math.random();

		word = validWords[Math.floor(validWords.length * randomValue)];
	}

	return word;
}
function mulberry32(seed : any) {
	var t = (seed += 0x6d2b79f5);
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function isValidWord(letters : Array<Letter>) {
	var test 	= letters.map((letter : Letter) => letter.value).join('');
	var found 	= gameWords.find((word : string) => test == word)
					|| validWords.find((word : string) => test == word);

	return !!found;
}

export function gameStateReducer(state : GameState, action : Action) {
	switch (action.type) {
		case 'KeyPress':			{ state = onKeyPress(state, action.key || ''); break; }
		case 'ScoringCompleted':	{ state = onScoringCompleted(state); break; }
		case 'ClearHint': 			{ state = clearHint(state); break; }
		case 'ChangeWordLength':	{ state = makeInitialGameState(action.wordLength || 5); break }
	}
	return state;

	function addLetter(state : GameState, letter : string) : GameState {
		var row = state.rows[state.activeRow];
		if (row.letters.length == state.wordLength)
			return state;

		row = {...row, letters:[...row.letters]}

		row.letters.push({ value:letter, clue:LetterClues.Editing });

		if (row.letters.length == state.wordLength)
			row.isValidWord = isValidWord(row.letters);

		var rows = [...state.rows];
		rows[state.activeRow] = row;

		var newState = {...state, rows };
		return newState;
	}
	function removeLetter(state : GameState) : GameState {
		var row = state.rows[state.activeRow];
		row = {...row, letters:row.letters.slice(0, row.letters.length-1), isValidWord:false };

		var rows = [...state.rows];
		rows[state.activeRow] = row;

		var newState = {...state, rows };
		return newState;
	}
	function scoreGuess(state : GameState) : GameState {
		var row = state.rows[state.activeRow];

		if (!row.isValidWord) {
			if (row.letters.length < state.wordLength)
				return setHint(state, 'Too short');
			else
				return setHint(state, 'Not a valid word');
		}

		row = {...row, letters:[...row.letters] };

		var word	= row.letters.map((letter : Letter) => letter.value).join('');
		var target	= state.secretWord;

		var elusive = Array<string>();
		target.split('').forEach((letter : string, i : number) => {
			if (word[i] !== letter)
				elusive.push(letter);
		});

		for (var i in row.letters) {
			if (target[i] === row.letters[i].value) {
				row.letters[i].clue = LetterClues.Correct;
			} else {
				var pos = elusive.indexOf(row.letters[i].value);
				if (pos >= 0) {
					row.letters[i].clue = LetterClues.Elsewhere;
					elusive[pos] = ''; // "use it" so we don't clue the same letter twice
				} else {
					row.letters[i].clue = LetterClues.Absent;
				}
			}
		}

		row.rowState = RowStates.Pending;

		var rows = [...state.rows];
		rows[state.activeRow] = row;

		var lettersUsed	= updateLettersUsed(state.lettersUsed, row);
		var isCorrect	= row.letters.every((letter : Letter) => letter.clue == LetterClues.Correct);

		var newState : GameState = {...state, rows, lettersUsed, gameState:GameStates.Scoring, isCorrect };
		return newState;
	}
	function updateLettersUsed(lettersUsed : LettersUsedDictionary, row : Row) : LettersUsedDictionary {
		lettersUsed = {...lettersUsed};

		for (var i in row.letters) {
			var letter = row.letters[i];

			if (!lettersUsed[letter.value] || lettersUsed[letter.value] < letter.clue)
				lettersUsed[letter.value] = letter.clue;
		}

		return lettersUsed;
	}
	function setHint(state : GameState, hint : string) : GameState {
		var newState = {...state, hint };
		return newState;
	}
	function clearHint(state : GameState) : GameState {
		var newState = {...state, hint:'' };
		return newState;
	}
	function onKeyPress(state : GameState, key : string) : GameState {
		if (key == 'Enter') {
			state = scoreGuess(state);
		} else if (key == 'Backspace') {
			state = removeLetter(state);
		} else {
			key = key.toLowerCase();

			if (key >= 'a' && key <= 'z')
				state = addLetter(state, key);
		}

		return state;
	}
	function onScoringCompleted(state : GameState) : GameState {
		var newState = {...state};

		if (newState.isCorrect || newState.rows.length == 6)
			newState.gameState = GameStates.Finished;
		else
			newState.gameState = GameStates.Guessing;

		newState.rows = [...newState.rows];
		newState.rows[newState.rows.length-1].rowState = RowStates.Locked;
		newState.rows.push(makeInitialRowState());
		newState.activeRow++;

		return newState;
	}
}
