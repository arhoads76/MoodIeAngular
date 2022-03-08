import { Component, Injectable, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { LetterClues, LettersUsedDictionary } from './GameState'
import { Logger } from './services/Logger';

const keyboardKeys : Array<Array<string>> = [
	"QWERTYUIOP".split(''),
	"ASDFGHJKL".split(''),
	["Backspace", ..."ZXCVBNM".split(''), "Enter"]
];

@Component({
  selector: 'app-keyboard',
  templateUrl: './app.keyboard.html',
})
@Injectable()
export class Keyboard implements OnInit {
	keyboardKeys : Array<Array<string>>;

	@Input() disabled? : boolean;
	@Input() lettersUsed? : LettersUsedDictionary;
	@Output() notifyKeyPressed : EventEmitter<string>;

	constructor(
		private logger : Logger,
	) {
		this.keyboardKeys = keyboardKeys;
		this.notifyKeyPressed = new EventEmitter<string>();
	}
	ngOnInit() {
	}

	@HostListener("document:keydown", ['$event'])
	onKeyDown(e : any) {
		if (this.disabled)
			return;

		var key = e.key;
		if (key == 'Backspace')
			this.notifyKeyPressed.emit(key);
	}
	@HostListener("document:keypress", ['$event'])
	onKeyPress(e : any) {
		if (this.disabled)
			return;

		var key = e.key;
		if ((key == 'Enter' || key >= 'a' && key <= 'z') || key >= 'A' && key <= 'Z') {
			this.notifyKeyPressed.emit(key);
		}
	}
	onKeyClick(e? : any) {
		if (!e) e = window.event;

		if (this.disabled)
			return;

		var key = e.target.getAttribute('rel') || e.target.parentElement.getAttribute('rel') || e.target.parentElement.parentElement.getAttribute('rel');
		this.notifyKeyPressed.emit(key);
	}

	isAbsent(letter : string) : boolean {
		return this.isLetterStatus(letter, LetterClues.Absent);
	}
	isElsewhere(letter : string) : boolean {
		return this.isLetterStatus(letter, LetterClues.Elsewhere);
	}
	isCorrect(letter : string) : boolean {
		return this.isLetterStatus(letter, LetterClues.Correct);
	}
	isLetterStatus(letter : string, status : LetterClues) : boolean {
		return this.lettersUsed != undefined && this.lettersUsed[letter.toLowerCase()] == status;
	}
}
