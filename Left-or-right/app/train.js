var Train = function() {
	this.$id = "train";
	this.$colorBox = null;
	this.$effect = null;
	this.$continueactor = null;
}

Train.prototype.genTimeline = function(svgPathEle, bOpposite, totalTime) {
	return function(t) {
		if (t >= totalTime)
			t = totalTime;

		if (bOpposite)
			t = totalTime - t;

		return svgPathEle.getPointAtLength(svgPathEle.getTotalLength() * t / totalTime);
	};
};

Train.prototype.Train = function() {
	var m = this.$colorBox.model;
	var pipe = this.$colorBox.pipe;
	var d = this.$colorBox.director;
	var TimeStamper = d.TimeStamper;
	var debug = this.$colorBox.debug;
	var ani = this.$colorBox.animate;
	var Actor = this.$colorBox.node.Actor;
	var effect = this.$effect;

	var self = this;
	var a = Actor.extend([], {
		initialize: function(param) {
			this.execProto("initialize", param);

			var self = this;

			var clocker = d.director().exec("globalTimeStamper");
			debug.assert(param.level != undefined && param.id != undefined, "parameter error");
			this.slot("_level", param.level);

			var timeStamp = TimeStamper.create();
			var p = pipe.createEventTrigger(timeStamp);
			this.slot("_pipe", p);
			//this.slot("clocker", timeStamp);
			this.slot("clocker", timeStamp);

			this.slot("_id", param.id);
			this.slot("startPath", param.path);
			this.slot("_color", param.color);

			/*
			  initialized
			  traversing
			  stopped
			  died
			  success
			 */
			this.slot("_state", "initialized");

			if (typeof(param.speed) == "number")
				this.slot("_speed", param.speed);

			this.slot("_curPS", undefined);

			this.exec("regUpdate",
				function(t) {
					timeStamp.exec("adjust", t);
					if (self.exec("state") == "traversing") {
						pipe.triggerEvent(p, {
							type: "curMatrix",
							matrix: self.exec("matrix"),
							ps: self.exec("curPS")
						});
					}
				});
		},

		triggerEvent: function() {
			//this.slot("clocker").exec("stepForward", 100);

			pipe.triggerEvent(this.slot("_pipe"), {
				type: "curMatrix",
				matrix: this.exec("matrix"),
				ps: this.exec("curPS")
			});
		},

		pipe: function() {
			return this.slot("_pipe");
		},

		//这里状态不是为了做状态机，仅仅是为了检查错误
		state: function() {
			return this.slot("_state");
		},

		id: function() {
			return this.slot("_id");
		},

		setState: function(s) {
			//some assert
			debug.assert(s != "traversing" || this.exec("state") != "died", "local error");
			this.slot("_state", s);
		},

		traverse: function(ps, bOpposite) {
			var speed = this.slot("_speed");

			var totalTime = ps.svgPathEle.getTotalLength() / speed;

			this.exec("setState", "traversing");
			//ani.moveToBySpeed([start, this.slot("_speed")], [end]);
			var traverseAni = ani.Animation.create({
				timeline: self.genTimeline(ps.svgPathEle, bOpposite, totalTime),
				variable: function(val, target) {
					target.exec("translate", val.x, val.y);
				},
				totalTime: totalTime
			});

			var out = this;
			traverseAni.exec("regCBByPercent",
				1,
				function() {
					ps.traverseDown(out, bOpposite);
				});

			this.exec("addAnimation", traverseAni);
			this.slot("_curPs", ps);
		},

		curPS: function() {
			return this.slot("_curPs");
		},

		stop: function() {
			this.exec("setState", "stopped");
		},

		eatProp: function(prop) {

		},

		die: function() {
			//remove move animation
			this.exec("removeAllAnimations");
			this.exec("setState", "died");

			this.slot("_curPs", undefined);

			var scene = this.slot("_level").exec("scene");
			//create effect
			var effectActor = effect.bombEffectActor(this);
			scene.exec("addActor", effectActor);
			var mat = this.exec("matrix");
			effectActor.exec("pushTransform", "matrix", mat);
			effectActor.exec("applyTranslate", 0, 0, 1000);

			this.slot("_level").exec("trainDied", this);
			this.slot("_level").exec("scene").exec("removeActor", this);
		},

		success: function() {
			this.exec("setState", "success");

			var scene = this.slot("_level").exec("scene");

			this.slot("_level").exec("trainSuccess", this);
			//scene.exec("removeActor", this);

			var sm = m.rotateModel(self.$continueactor.StarModel().create({
				r: 15,
				fill: this.exec("color")
			}));
			this.exec("setModel", sm);

			//effect
			var scene = this.slot("_level").exec("scene");
			//create effect
			var effectActor = effect.successEffectActor(this);
			scene.exec("addActor", effectActor);
			var mat = this.exec("matrix");
			effectActor.exec("pushTransform", "matrix", mat);
			effectActor.exec("applyTranslate", 0, 0, 1000);
		},

		color: function() {
			return this.slot("_color");
		},
	});

	return a;
}

bearcat.module(Train, typeof module !== 'undefined' ? module : {});