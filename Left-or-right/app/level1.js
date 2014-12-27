var Level1 = function() {
	this.$id = "level1";
	this.$colorBox = null;
	this.$train = null;
	this.$collide = null;
	this.$trainModel = null;
	this.$continueactor = null;
	this.$switcheractor = null;
}

//获取所有需要放置train的path
Level1.prototype.getTrainPaths = function(ps) {
	var getAllPS = this.$colorBox.ps.getAllPS;
	var paths = getAllPS(ps);

	return paths
		.filter(function(p) {
			return p.type == "path";
		})
		.filter(function(path) {
			return path.svgPathEle.userProps.train != undefined;
		});
};

//根据train number获取这个train初始放在哪个path上
Level1.prototype.getTrainPath = function(ps, number) {
	var getAllPS = this.$colorBox.ps.getAllPS;
	var paths = getAllPS(ps);

	var p;

	paths
		.filter(function(p) {
			return p.type == "path";
		})
		.some(function(path) {
			if (path.svgPathEle.userProps.train == number) {
				p = path;
				return true;
			}
			return false;
		});

	return p;
};

Level1.prototype.getLevelStar = function(level) {
	var star = 0;

	level.slot("_trains").forEach(function(train) {
		if (train.exec("state") == "success")
			star++;
	});

	return star;
};

Level1.prototype.genOnClickStartButton = function(level) {
	return function(evt, button) {
		switch (evt.type) {
			case 'mouseClicked':
				level.exec("start");
				break;
			default:
				break;
		}
	};
};

Level1.prototype.genOnNext = function(level) {
	var ani = this.$colorBox.animate;
	var self = this;

	return function() {
		var ca = level.slot("_ca");

		var showingSani = ani.scaleToByTime([0, {
			x: 1,
			y: 1
		}, 'sine'], [1500, {
			x: 0,
			y: 0
		}, 'linear']);
		var showingRani = ani.rotateToByTime([0, Math.PI * 4, 'sine'], [1500, 0, 'linear']);
		ca.exec("addAnimation", showingSani);
		ca.exec("addAnimation", showingRani);

		showingSani.exec("regCBByPercent", 1, function() {
			level.exec("scene").exec("removeActor", ca);
			main.runNextLevel();
		});
	};
};

Level1.prototype.genAgain = function(level) {
	var ani = this.$colorBox.animate;
	var self = this;

	return function() {
		var ca = level.slot("_ca");

		var showingSani = ani.scaleToByTime([0, {
			x: 1,
			y: 1
		}, 'sine'], [1500, {
			x: 0,
			y: 0
		}, 'linear']);
		var showingRani = ani.rotateToByTime([0, Math.PI * 4, 'sine'], [1500, 0, 'linear']);
		ca.exec("addAnimation", showingSani);
		ca.exec("addAnimation", showingRani);

		showingSani.exec("regCBByPercent",
			1,
			function() {
				level.exec("scene").exec("removeActor", ca);
				main.runCurLevelAgain();
			});
	};
};

Level1.prototype.createAllTrain = function(level, ps) {
	//paths is object not array
	var paths = this.getTrainPaths(ps);
	var Train = this.$train;
	var TrainModel = this.$trainModel;

	return paths.reduce(function(trains, path) {
		var trainId = path.svgPathEle.userProps.train;
		var trainColor = path.svgPathEle.userProps.traincolor;
		var trainSpeed = path.svgPathEle.userProps.speed;

		var train = Train.Train().create({
			id: trainId,
			speed: trainSpeed,
			level: level,
			path: path,
			color: trainColor
		});
		var trainModel = TrainModel.TrainModel().create({
			pipe: train.exec("pipe"),
			color: trainColor,
			clocker: train.slot("clocker")
		});
		train.exec("setModel", trainModel);

		trains[trainId] = train;

		return trains;
	}, []);
};

Level1.prototype.Level1 = function() {
	var m = this.$colorBox.model;
	var d = this.$colorBox.director;
	var ani = this.$colorBox.animate;
	var debug = this.$colorBox.debug;
	var Actor = this.$colorBox.node.Actor;
	var Button = this.$colorBox.Button;
	var Level = this.$colorBox.level.Level;
	var ps = this.$colorBox.ps;

	var self = this;
	var l = Level.extend([], {
		initialize: function(param) {
			this.execProto("initialize", param);

			var scene = this.exec("scene");

			debug.assert(param.svgDoc != undefined, "parameter error");

			//create map
			var pathmodel = m.Model.create({
				type: "ps",
				ps: ps.createPs(param.svgDoc)
			});
			var psActor = Actor.create({
				model: pathmodel
			});
			scene.exec("addActor", psActor);

			self.$switcheractor.createAllSwitcherActors(pathmodel.slot("ps"), this)
				.forEach(function(sa) {
					scene.exec("addActor", sa);
				});

			//create train
			var trains = self.createAllTrain(this, pathmodel.slot("ps"));
			trains.forEach(function(train) {
				scene.exec("addActor", train, psActor);
				//collide.addTrain(train);

				//将train放在合适的位置
				var path = self.getTrainPath(pathmodel.slot("ps"), train.exec("id"));
				var bOpposite = path.svgPathEle.userProps.opposite;
				var pstn = bOpposite ? path.svgPathEle.getEndPstn() : path.svgPathEle.getStartPstn();
				var otherPstn = bOpposite ? path.svgPathEle.getPointAtLength(path.svgPathEle.getTotalLength() - 5) : path.svgPathEle.getPointAtLength(5);

				train.exec("triggerEvent");

				if (bOpposite) {
					var pstn1 = path.svgPathEle.getPointAtLength(path.svgPathEle.getTotalLength() - 0.1);

					train.exec("translate", pstn.x, pstn.y);
					train.exec("triggerEvent");

					train.exec("translate", pstn1.x, pstn1.y);
					train.exec("triggerEvent");
				} else {
					var pstn1 = path.svgPathEle.getPointAtLength(0.1);

					train.exec("translate", pstn.x, pstn.y);
					train.exec("triggerEvent")

					train.exec("translate", pstn1.x, pstn1.y);
					train.exec("triggerEvent");
				}
			});

			this.slot("_trains", trains);

			this.slot("_ps", psActor);

			this.slot("_state", "waiting");

			//create start button
			var start = Button.create({
				level: this,
				cb: self.genOnClickStartButton(this),
				normalModel: m.TextModel.create({
					text: "start",
					fill: "rgb(255, 0, 0)"
				})
			});
			scene.exec("addActor", start);
			this.slot("_startActor", start);
			start.exec("translate", 100, 20);

			var s = ani.scaleToByTime(
				[0, {
					x: 1.4,
					y: 1.4
				}, 'linear'], [1000, {
					x: 2,
					y: 2
				}, 'linear'], [2000, {
					x: 1.4,
					y: 1.4
				}, 'linear']
				/*        [3000, {x:1.2, y:1.2}, 'linear'], 
				        [4000,{x:1, y:1}, 'linear']*/
			);
			start.exec("addAnimation", ani.times(s, Infinity));
			start.exec("scale", 1.4, 1.4);

			start.exec("addEventListener",
				"mouseOut", (function() {
					//change cursor to hand
					var painter = d.director().exec("defaultPainter");
					var canvas = painter.exec("sketchpad").canvas;

					canvas.style.cursor = "default";
				}).bind(start));

			start.exec("addEventListener",
				"mouseOver", (function() {
					//change cursor to hand
					var painter = d.director().exec("defaultPainter");
					var canvas = painter.exec("sketchpad").canvas;

					canvas.style.cursor = "hand";
				}).bind(start));

		},

		update: function(t, dt) {
			this.execProto("update", t, dt);

			if (this.slot("_state") == "running")
				self.$collide.resolve();

			if (this.exec("isGameOver") && undefined == this.slot("_ca")) {
				//trains 的id从1开始，所以数组的长度要减去1
				var ca = self.$continueactor.continueActorCtor(this, self.getLevelStar(this), this.slot("_trains").length - 1, self.genOnNext(this), self.genAgain(this));
				this.exec("scene").exec("addActor", ca);
				ca.exec("translate", 200, 200, 100);
				ca.exec("scale", 0, 0);

				var showingSani = ani.scaleToByTime([0, {
					x: 0,
					y: 0
				}, 'sine'], [1500, {
					x: 1,
					y: 1
				}, 'linear']);
				var showingRani = ani.rotateToByTime([0, 0, 'sine'], [1500, Math.PI * 4, 'linear']);
				ca.exec("addAnimation", showingSani);
				ca.exec("addAnimation", showingRani);

				this.slot("_ca", ca);
			}
		},

		start: function() {
			if (this.slot("_state") != "waiting")
				return;

			this.slot("_trains")
				.forEach(function(train) {
					var path = train.slot("startPath");
					path.drive(train, undefined, path.svgPathEle.userProps.opposite);

					self.$collide.addTrain(train);
				});

			this.slot("_state", "running");

			this.exec("scene").exec("removeActor", this.slot("_startActor"));
		},

		isGameOver: function() {
			var isSomeTrainRunning =
				this.slot("_trains").some(function(train) {
					var trainState = train.exec("state");
					return !(trainState == "died" || trainState == "success");
				});

			return !isSomeTrainRunning;
		},

		trainDied: function(train) {
			self.$collide.rmTrain(train);
		},

		trainSuccess: function(train) {
			self.$collide.rmTrain(train);
		}
	});

	return l;
}

bearcat.module(Level1, typeof module !== 'undefined' ? module : {});