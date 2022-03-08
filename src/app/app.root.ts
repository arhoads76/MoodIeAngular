import { Component, Injectable, OnInit } from '@angular/core';
import { Game, GameStates } from './GameState';

@Component({
  selector: 'app-root',
  templateUrl: './app.root.html',
  styleUrls: ['./app.root.scss']
})
@Injectable()
export class AppRoot {
	game : Game;

	constructor() {
		this.game = new Game();
	}

	onKeyPress(key : string) {
		this.game.onKeyPress(key);
	}
	disableKeyboard() : boolean {
		return this.game.state.gameState == GameStates.Scoring || this.game.state.gameState == GameStates.Finished;
	}
}
