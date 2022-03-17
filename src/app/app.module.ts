import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoot } from './app.root';
import { Toolbar } from './app.toolbar';
import { GameBoard } from './app.gameBoard';
import { Cell } from './app.cell';
import { Keyboard } from './app.keyboard';
import { Logger } from './services/Logger';

@NgModule({
	declarations: [
		AppRoot,
		Toolbar,
		GameBoard,
		Cell,
		Keyboard,
	],
	imports: [
		BrowserModule
	],
	providers: [
		Logger
	],
	bootstrap: [
		AppRoot
	]
})
export class AppModule { }
