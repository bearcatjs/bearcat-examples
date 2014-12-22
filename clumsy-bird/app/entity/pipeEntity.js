var PipeEntity = function() {
	this.$id = "pipeEntity";
	this.$init = "init";
	this.ctor = null;
}

PipeEntity.prototype.init = function() {
	this.ctor = me.ObjectEntity.extend({
		init: function(x, y) {
			var settings = {};
			settings.image = me.loader.getImage('pipe');
			settings.width = 148;
			settings.height = 1664;
			settings.spritewidth = 148;
			settings.spriteheight = 1664;


			this.parent(x, y, settings);
			this.alwaysUpdate = true;
			this.gravity = 5;
			this.updateTime = false;
			this.type = 'pipe';
		},

		update: function(dt) {
			// mechanics
			if (!game.data.start) {
				return this.parent(dt);
			}
			this.pos.add(new me.Vector2d(-this.gravity * me.timer.tick, 0));
			if (this.pos.x < -148) {
				me.game.world.removeChild(this);
			}
			return this.parent(dt);
		},

	});
}

PipeEntity.prototype.get = function(x, y) {
	return new this.ctor(x, y);
}

bearcat.module(PipeEntity, typeof module !== 'undefined' ? module : {});