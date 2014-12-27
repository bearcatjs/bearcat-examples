if (typeof __resources__ === "undefined") {
	var __resources__ = {}
}

__resources__["/colorBoxAdaptor.js"] = {
	meta: {
		mimetype: "application/javascript"
	},
	data: function(exports, require, module, __filename, __dirname) {
		var ps = require("ps");
		var node = require("node");
		var pipe = require("pipe");
		var level = require("level");
		var model = require("model");
		var debug = require("debug");
		var geo = require("geometry");
		var helper = require("helper");
		// var effect = require("effect");
		var animate = require("animate");
		var painter = require("painter");
		var particle = require("particle")
		var director = require("director");
		// var openlevel = require("openlevel");
		var Button = require("gui/button").Button;
		var leveltransition = require("leveltransition");

		var ColorBox = function() {
			this.$id = "colorBox";
			this.ps = ps;
			this.geo = geo;
			this.node = node;
			this.pipe = pipe;
			this.level = level;
			this.model = model;
			this.debug = debug;
			this.helper = helper;
			// this.effect = effect;
			this.Button = Button;
			this.animate = animate;
			this.painter = painter;
			this.director = director;
			this.particle = particle;
			// this.openlevel = openlevel;
			this.leveltransition = leveltransition;
		}

		console.log('register colorBox colorBoxAdaptor.....')
		bearcat.module(ColorBox, typeof module !== 'undefined' ? module : {});
	}
}