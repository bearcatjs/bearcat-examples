var Game = function() {
	this.$id = "game";
	this.$dataResource = null;
	this.$titleScreen = null;
	this.$playScreen = null;
	this.$gameOverScreen = null;
	this.$birdEntity = null;
	this.$pipeEntity = null;
	this.$hitEntity = null;
	this.data = {
		score: 0,
		steps: 0,
		start: false,
		newHiScore: false,
		muted: false
	};
}

Game.prototype.onload = function() {
	if (!me.video.init("screen", 900, 600, true, 'auto')) {
		alert("Your browser does not support HTML5 canvas.");
		return;
	}

	var dataResource = this.$dataResource;
	me.audio.init("mp3,ogg");
	me.loader.onload = this.loaded.bind(this);
	me.loader.preload(dataResource.get());
	me.state.change(me.state.LOADING);
}

Game.prototype.loaded = function() {
	var playScreen = this.$playScreen;
	var titleScreen = this.$titleScreen;
	var gameOverScreen = this.$gameOverScreen;
	var birdEntity = this.$birdEntity;
	var pipeEntity = this.$pipeEntity;
	var hitEntity = this.$hitEntity;
	me.state.set(me.state.MENU, titleScreen.get());
	// me.state.set(me.state.MENU, new game.TitleScreen());
	me.state.set(me.state.PLAY, playScreen.get());
	// me.state.set(me.state.PLAY, new game.PlayScreen());
	me.state.set(me.state.GAME_OVER, gameOverScreen.get());
	// me.state.set(me.state.GAME_OVER, new game.GameOverScreen());

	me.input.bindKey(me.input.KEY.SPACE, "fly", true);
	me.input.bindKey(me.input.KEY.M, "mute", true);
	me.input.bindPointer(me.input.KEY.SPACE);

	me.pool.register("clumsy", birdEntity.ctor);
	me.pool.register("pipe", pipeEntity.ctor, true);
	me.pool.register("hit", hitEntity.ctor, true);

	// in melonJS 1.0.0, viewport size is set to Infinity by default
	me.game.viewport.setBounds(0, 0, 900, 600);
	me.state.change(me.state.MENU);
}

bearcat.module(Game, typeof module !== 'undefined' ? module : {});