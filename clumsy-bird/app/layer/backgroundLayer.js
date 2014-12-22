var BackgroundLayer = function() {
	this.$id = "backgroundLayer";
	this.$init = "init";
	this.ctor = null;
}

BackgroundLayer.prototype.init = function() {
	this.ctor = me.ImageLayer.extend({
		init: function(image, z, speed) {
			var name = image;
			var width = 900;
			var height = 600;
			var ratio = 1;
			// call parent constructor
			this.parent(name, width, height, image, z, ratio);
		},

		update: function() {
			if (me.input.isKeyPressed('mute')) {
				game.data.muted = !game.data.muted;
				if (game.data.muted) {
					me.audio.disable();
				} else {
					me.audio.enable();
				}
			}
			return true;
		}
	});
}

BackgroundLayer.prototype.get = function(image, z, speed) {
	return new this.ctor(image, z, speed);
}

bearcat.module(BackgroundLayer, typeof module !== 'undefined' ? module : {});