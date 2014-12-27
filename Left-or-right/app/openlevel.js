var Openlevel = function() {
	this.$id = "openlevel";
	this.$colorBox = null;
}

Openlevel.prototype.createOpenActor = function() {
	var m = this.$colorBox.model;
	var Actor = this.$colorBox.node.Actor;

	var canvas = document.createElement("canvas");
	canvas.width = 640;
	canvas.height = 480;

	// var nt = new NaughtyText(400, 3, 4, canvas, 1.8, 3000, 1000);
	var nt = bearcat.getBean("naughty", 400, 3, 4, canvas, 1.8, 3000, 1000);
	nt.drawTextTemplate("Left or Right ?", 10, 100);

	var model = m.ProcedureModel.create({
		draw: function(m, painter) {
			var ctx = painter.exec("sketchpad");

			nt.draw(ctx);
		}
	});

	var lastTime;

	var a = Actor.create({
		model: model
	});
	a.exec("regUpdate",
		function(t, actor) {
			if (undefined == lastTime)
				lastTime = t;
			//update open flash
			nt.update(t - lastTime);
			lastTime = t;
		});

	return a;
};

Openlevel.prototype.OpenLevel = function() {
	var Level = this.$colorBox.level.Level;
	var Actor = this.$colorBox.node.Actor;
	var ani = this.$colorBox.animate;
	var d = this.$colorBox.director;
	var m = this.$colorBox.model;

	var self = this;
	var l = Level.extend([], {
		initialize: function(param) {
			this.execProto("initialize", param);

			var a = self.createOpenActor();

			this.exec("scene").exec("addActor", a);

			//create skip actor
			var bg = m.ConvexModel.create({
				vertexes: [{
					x: 0,
					y: 9
				}, {
					x: 24,
					y: 9
				}, {
					x: 24,
					y: -9
				}, {
					x: 0,
					y: -9
				}],
			});

			var arrow = m.LineModel.create({
				m: {
					x: 0,
					y: 0
				},
				l: [{
					x: 0,
					y: 3
				}, {
					x: 18,
					y: 3
				}, {
					x: 18,
					y: 9
				}, {
					x: 24,
					y: 0
				}, {
					x: 18,
					y: -9
				}, {
					x: 18,
					y: -3
				}, {
					x: 0,
					y: -3
				}, {
					x: 0,
					y: 3
				}],
				strokeStyle: "orangered"
			});

			var model = m.scaleModel(m.overlap(bg, arrow), 1.5, 1.5);

			var s = Actor.create({
				model: model,
				level: this
			});
			s.exec("addEventListener",
				"mouseClicked",
				function(evt, a) {
					main.runNextLevel();
				});

			s.exec("addEventListener",
				"mouseOut", (function() {
					//change cursor to hand
					var painter = d.director().exec("defaultPainter");
					var canvas = painter.exec("sketchpad").canvas;

					canvas.style.cursor = "default";
				}).bind(s));

			s.exec("addEventListener",
				"mouseOver", (function() {
					//change cursor to hand
					var painter = d.director().exec("defaultPainter");
					var canvas = painter.exec("sketchpad").canvas;

					canvas.style.cursor = "pointer";
				}).bind(s));



			s.exec("translate", 600, 300, 1);
			this.exec("scene").exec("addActor", s);

			var moveAni = ani.moveToX(570, 600, 1000);
			var a = ani.times(ani.seq([moveAni, moveAni.exec("reverse")]), Infinity);
			s.exec("addAnimation", a);

			this.slot("_startTime", undefined);
		},
		/*
		update:function(t)
		{
		  this.execProto("update", t);

		  if (this.slot("_startTime") == undefined)
		    this.slot("_startTime", t);

		  var startTime = this.slot("_startTime");
		  if (t - startTime > 4000)
		    require("main").runNextLevel();
		}
		*/
	});

	return l;
}

bearcat.module(Openlevel, typeof module !== 'undefined' ? module : {});