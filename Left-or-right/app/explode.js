var Explode = function() {
	this.$id = "explode";
	this.$init = "init";
	this.$colorBox = null;
}

Explode.prototype.init = function() {

}

Explode.prototype.getSpacePstn = function(s) {
	var debug = this.$colorBox.debug;

	var t = s.exec("getTransformSteps")[0];
	debug.assert(!isNaN(t[1]) && typeof(t[1]) == "number" &&
		!isNaN(t[2]) && typeof(t[2]) == "number", "logical error 1");

	return {
		x: t[1],
		y: t[2]
	};
}

Explode.prototype.setSpacePstn = function(s, x, y) {
	var debug = this.$colorBox.debug;

	debug.assert(!isNaN(x) && typeof(x) == "number" &&
		!isNaN(x) && typeof(x) == "number", "logical error 2");

	s.exec("translate", x, y);
}

Explode.prototype.createExplode = function(createModel, duration, maxSpeed) {
	var m = this.$colorBox.model;
	var p = this.$colorBox.particle;
	var CircleModel = m.CircleModel;
	var Particle = p.Particle;
	var Emitter = p.Emitter;

	emitterShape = CircleModel.create({
		radius: 5,
		fill: "rgba(0, 255, 0, 0)",
		/*{r:255, g:0, b:0, a: 1},*/
		//ratioAnchorPoint: {x: 0.5, y:0.5}
	});

	emitterShape = m.moveRelative(-0.5, -0.5, emitterShape);

	var self = this;
	particle = Particle.exec("clone", [], {
		updateDynamic: function(dt, owner, env) {
			var space = this.slot("space");
			var pos = self.getSpacePstn(space);
			var age = this.exec("age");
			var life = this.exec("life");
			var v = this.slot("velocity");
			var radians = v.radians;
			var speed = v.speed(age / life);
			var vx = Math.cos(radians) * speed;
			var vy = Math.sin(radians) * speed;
			//var acceleration = this.slot("acceleration");
			//var ax = acceleration.ax;
			//var ay = acceleration.ay;
			pos.x += vx * dt;
			pos.y += vy * dt;
			//pos.y = pos.y+dt*v.y+0.5*ay*dt*dt;
			//pos.x = pos.x+dt*v.x+0.5*ax*dt*dt;
			//alert([pos.x, pos.y, acceleration.ax, acceleration.ay]);
			//space.position = pos;
			self.setSpacePstn(space, pos.x, pos.y);
			//v.x += ax*dt;
			//v.y += ay*dt;
			//this.slot("velocity", v);
			//console.log(dt);
			//console.log(v.x + "," + v.y + "," + ax*dt+ ","+ay*dt+","+dt);
			var model = this.slot("model");
			var fill = model.slot("fill");
			// console.log(fill);
			var strs = fill.split(",");
			var rgba = "".concat(strs[0], ",", strs[1], ",", strs[2], ",", parseFloat((life - age) / life), ")");
			//alert(rgba);
			model.slot("fill", rgba);
			//console.log(model.fill);
			return true;
		}
	});

	particle.exec("life", duration);
	//particle.slot("model", createModel());

	emitter = Emitter.exec("clone", [], {
		initParticle: function(p, which, familyCount, env) {
			if (maxSpeed === undefined) {
				maxSpeed = 300;
			}
			//var speed = 0 * (1 + Math.random());
			//var a = 6000 * (1 + Math.random());
			p.slot("model", createModel());
			var radians = Math.random() * (2 * Math.PI);
			//var x = Math.cos(radians) * speed;
			//var ax = Math.cos(radians) * a;
			//var y = Math.sin(radians) * speed;
			//var ay = Math.sin(radians) * a;
			//alert([which, familyCount]);
			//alert([ax, ay]);
			//particle.slot("velocity", {x: (Math.random() - 0.5) * 500, y: (Math.random() - 0.5) * 500});
			var r = Math.random();
			p.slot("velocity", {
				radians: radians,
				speed: function(x) {
					var range = 1;
					return Math.sin(Math.PI * ((1 - range) * 0.5 + x * range)) * (1 + r) * maxSpeed;
				}
			});
			//particle.slot("acceleration", {ax: ax, ay: ay});
			//particle.slot("velocity", {x: x, y: y});
		},

		reset: function() {
			this.execProto("reset");
			var s = this.slot("space");
			//s.position = {x: 0, y:0};
			//setSpacePstn(s, 200, 200);
			this.exec("life", duration);


			return true;
		}
	});

	var count = 15;
	emitter.slot("particle", particle);
	emitter.slot("bulletsPerShot", count);
	emitter.slot("shotRate", 1);
	emitter.exec("maxCount", count);
	emitter.slot("model", emitterShape);
	return emitter;
}

bearcat.module(Explode, typeof module !== 'undefined' ? module : {});