var Continueactor = function() {
	this.$id = "continueactor";
	this.$init = "init";
	this.$colorBox = null;
	this.debug = null;
	this.model = null;
	this.actor = null;
	this.director = null;
}

Continueactor.prototype.init = function() {
	this.debug = this.$colorBox.debug;
	this.model = this.$colorBox.model;
	this.director = this.$colorBox.director;
	this.actor = this.$colorBox.node.Actor;
	var painter = this.$colorBox.painter;
	var geo = this.$colorBox.geo;

	function drawStar(ctx, r) {
		ctx.save();
		ctx.beginPath()
		ctx.moveTo(r, 0);
		for (var i = 0; i < 9; i++) {
			ctx.rotate(Math.PI / 5);
			if (i % 2 == 0) {
				ctx.lineTo((r / 0.525731) * 0.200811, 0);
			} else {
				ctx.lineTo(r, 0);
			}
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	var drawStarModel = function(m, painter) {
		var ctx = painter.exec("sketchpad");

		ctx.save();

		ctx.fillStyle = m.slot("fill");

		drawStar(ctx, m.slot("r"));

		ctx.restore();
	};

	painter.HonestPainter.register('star', {
		bbox: function() {
			return new geo.Rect(0, 0, 0, 0);
		},
		draw: drawStarModel,
		inside: function() {
			return false;
		}
	});
}

Continueactor.prototype.StarModel = function() {
	var debug = this.debug;
	var model = this.model;
	var r = model.Model.extend([], {
		initialize: function(param) {
			debug.assert(param.r != undefined && param.fill != undefined, "param error");

			this.execProto("initialize", param);

			this.slot("type", "star");
		},
	});
	return r;
}

Continueactor.prototype.continueActorCtor = function(level, star, totalStar, continuation, again) {
	function drawStar(ctx, r) {
		ctx.save();
		ctx.beginPath()
		ctx.moveTo(r, 0);
		for (var i = 0; i < 9; i++) {
			ctx.rotate(Math.PI / 5);
			if (i % 2 == 0) {
				ctx.lineTo((r / 0.525731) * 0.200811, 0);
			} else {
				ctx.lineTo(r, 0);
			}
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	var m = this.model;
	var director = this.director;
	var Actor = this.actor;

	var baseModel = m.ConvexModel.create({
		vertexes: [{
			x: 0,
			y: 0
		}, {
			x: 150,
			y: 0
		}, {
			x: 150,
			y: 90
		}, {
			x: 0,
			y: 90
		}],
		stroke: "rgb(0, 0, 0)"
	});

	var sm = [],
		starModel = m.rotateModel(this.StarModel().create({
			r: 12,
			fill: "red"
		}), -Math.PI / 9.6),
		grayStarModel = m.rotateModel(this.StarModel().create({
			r: 12,
			fill: "slategray"
		}), -Math.PI / 9.6)

	for (var i = 0; i < totalStar; i++) {
		if (i < star)
			sm.push(m.translateModel(starModel, i * 20, 0));
		else
			sm.push(m.translateModel(grayStarModel, i * 20, 0));
	}

	sm = m.overlap.apply(undefined, sm);
	sm = m.moveRelative(-0.5, -0.5, m.translateModel(sm, 110, -6));

	var cmbg = m.ConvexModel.create({
		vertexes: [{
			x: 0,
			y: 0
		}, {
			x: 60,
			y: 0
		}, {
			x: 60,
			y: 30
		}, {
			x: 0,
			y: 30
		}],
		stroke: "rgb(0, 0, 0)"
	});
	var cmcontent = m.TextModel.create({
		text: "next",
		fill: "rgb(0, 0, 0)"
	});

	var cmbgbbox = director.director().exec("defaultPainter").exec("bbox", cmbg);
	var mc = m.overlap(cmbg, m.translateModel(m.moveRelative(-0.5, -0.7, cmcontent), cmbgbbox.size.width / 2, cmbgbbox.size.height / 2));

	var agmbg = m.ConvexModel.create({
		vertexes: [{
			x: 0,
			y: 0
		}, {
			x: 60,
			y: 0
		}, {
			x: 60,
			y: 30
		}, {
			x: 0,
			y: 30
		}],
		stroke: "rgb(0, 0, 0)"
	});
	var agmcontent = m.TextModel.create({
		text: "replay",
		fill: "rgb(0, 0, 0)"
	});
	var agmbgbbox = director.director().exec("defaultPainter").exec("bbox", agmbg);
	var agm = m.overlap(agmbg, m.translateModel(m.moveRelative(-0.5, -0.7, agmcontent), agmbgbbox.size.width / 2, agmbgbbox.size.height / 2));

	var model = m.overlap(baseModel, m.translateModel(m.overlap(sm, m.tagModel(m.translateModel(agm, -10, 15), "again"), m.tagModel(m.translateModel(mc, 60, 15), "next")), 20, 30));

	model = m.moveRelative(-0.5, -0.5, model);

	var mouseClickedCB = function(evt, a) {
		var painter = director.director().exec("defaultPainter");
		var canvas = painter.exec("sketchpad").canvas;

		switch (evt.type) {
			case "mouseClicked":
				if (evt.modelPath == "next") {
					continuation();
				} else if (evt.modelPath == "again") {
					again();
				}
				break;
			case "mouseOver":
				if (evt.modelPath == "next" || evt.modelPath == "again")
					canvas.style.cursor = "pointer";
				break;
			case "mouseOut":
				if (evt.modelPath == "next" || evt.modelPath == "again")
					canvas.style.cursor = "default";
				break;
		}
	};

	var a = Actor.create({
		model: model,
		level: level
	});
	a.exec("addEventListener", "mouseClicked", mouseClickedCB);
	a.exec("addEventListener", "mouseOver", mouseClickedCB);
	a.exec("addEventListener", "mouseOut", mouseClickedCB);
	return a;
}

bearcat.module(Continueactor, typeof module !== 'undefined' ? module : {});