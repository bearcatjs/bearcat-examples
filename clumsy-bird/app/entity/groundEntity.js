var GroundEntity = function() {
	this.$id = "groundEntity";
	this.$init = "init";
	this.ctor = null;
}

GroundEntity.prototype.init = function() {
	this.ctor = me.ObjectEntity.extend({
		init: function(x, y) {
			var settings = {};
			settings.image = me.loader.getImage('ground');
			settings.width = 900;
			settings.height = 96;

			this.parent(x, y, settings);
			this.alwaysUpdate = true;
			this.gravity = 0;
			this.updateTime = false;
			this.accel = new me.Vector2d(-4, 0);
			this.type = 'ground';
		},

		update: function(dt) {
			// mechanics
			if (!game.data.start) {
				return this.parent(dt);
			}
			this.pos.add(this.accel);
			if (this.pos.x < -this.renderable.width) {
				this.pos.x = me.video.getWidth() - 10;
			}
			return this.parent(dt);
		},

	});
}

GroundEntity.prototype.get = function(x, y) {
	return new this.ctor(x, y);
}

bearcat.module(GroundEntity, typeof module !== 'undefined' ? module : {});