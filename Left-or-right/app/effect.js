var Effect = function() {
	this.$id = "effect";
	this.$init = "init";
	this.$explode = null;
	this.$colorBox = null;
	this.$continueactor = null;
	this.actor = null;
	this.model = null;
	this.dl = [];
}

Effect.prototype.init = function() {
	this.model = this.$colorBox.model;
	this.director = this.$colorBox.director;
	this.actor = this.$colorBox.node.Actor;
}

Effect.prototype.drawEmitter = function(m, painter) {
	var emitter = m.slot("emitter");

	this.dl.length = 0;
	emitter.exec("outputAllModels", this.dl);

	painter.exec("drawDispList", this.dl);
};

Effect.prototype.createEmitterModel = function(emitter) {
	var m = this.model;
	return m.ProcedureModel.create({
		draw: this.drawEmitter.bind(this),
		emitter: emitter
	});
};

Effect.prototype.bombEffectActor = function(train) {
	var m = this.model;
	var Actor = this.actor;
	var explode = this.$explode;

	var emitter = explode.createExplode(function() {
			return m.CircleModel.create({
				fill: train.exec("color"),
				radius: (1 + Math.random()) * 3
			});
		},
		0.4,
		400);

	var model = this.createEmitterModel(emitter);

	var a = Actor.create({
		model: model
	});
	var lastTime;

	a.exec("regUpdate", function(t, actor) {
		if (lastTime == undefined)
			lastTime = t;

		emitter.exec("update", (t - lastTime) / 1000);
		lastTime = t;
	});

	return a;
}

Effect.prototype.successEffectActor = function(train) {
	var continueactor = this.$continueactor;
	var explode = this.$explode;
	var Actor = this.actor;

	var emitter = explode.createExplode(function() {
			return continueactor.StarModel().create({
				fill: train.exec("color"),
				r: (1 + Math.random()) * 3
			});
		},
		0.4,
		400);

	var model = this.createEmitterModel(emitter);

	var a = Actor.create({
		model: model
	});
	var lastTime;

	a.exec("regUpdate", function(t, actor) {
		if (lastTime == undefined)
			lastTime = t;

		emitter.exec("update", (t - lastTime) / 1000);
		lastTime = t;
	});

	return a;
}

bearcat.module(Effect, typeof module !== 'undefined' ? module : {});