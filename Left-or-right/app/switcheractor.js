var Switcheractor = function() {
	this.$id = "switcheractor";
	this.$colorBox = null;
}

Switcheractor.prototype.SwitcherActor = function() {
	var Actor = this.$colorBox.node.Actor;
	var d = this.$colorBox.director;

	var a = Actor.extend(undefined, {
		initialize: function(param) {
			this.execProto("initialize", param);

			this.slot("_switcher", param.switcher);

			this.exec("addEventListener",
				"mouseClicked", (function() {
					this.slot("_switcher").doSwitch();

				}).bind(this));

			this.exec("addEventListener",
				"mouseOut", (function() {
					//change cursor to hand
					var painter = d.director().exec("defaultPainter");
					var canvas = painter.exec("sketchpad").canvas;

					canvas.style.cursor = "default";
				}).bind(this));

			this.exec("addEventListener",
				"mouseOver", (function() {
					//change cursor to hand
					var painter = d.director().exec("defaultPainter");
					var canvas = painter.exec("sketchpad").canvas;

					canvas.style.cursor = "pointer";
				}).bind(this));
		}
	});

	return a;
}

Switcheractor.prototype.createAllSwitcherActors = function(ps, level) {
	var m = this.$colorBox.model;
	var PS = this.$colorBox.ps;
	var pses = PS.getAllPS(ps);

	var switcherModel = m.ConvexModel.create({
		vertexes: [{
			x: 0,
			y: 0
		}, {
			x: 70,
			y: 0
		}, {
			x: 70,
			y: 70
		}, {
			x: 0,
			y: 70
		}],
		stroke: "rgb(0, 50, 0)"
	});
	switcherModel = m.moveRelative(-0.5, -0.5, switcherModel);

	var self = this;
	return Object.keys(pses)
		.map(function(k) {
			return pses[k];
		})
		.filter(function(ps) {
			return ps.type == "switcher";
		})
		.map(function(switcher) {
			var a = self.SwitcherActor().create({
				model: switcherModel,
				level: level,
				switcher: switcher
			});
			var jointPoint = switcher.getJointPoint();
			a.exec("translate", jointPoint.x, jointPoint.y, -1);

			return a;
		});
};

bearcat.module(Switcheractor, typeof module !== 'undefined' ? module : {});