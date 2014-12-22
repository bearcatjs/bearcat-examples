var HitEntity = function() {
	this.$id = "hitEntity";
	this.$init = "init";
	this.ctor = null;
}

HitEntity.prototype.init = function() {
	this.ctor = me.ObjectEntity.extend({
		init: function(x, y) {
			var settings = {};
			settings.image = me.loader.getImage('hit');
			settings.width = 148;
			settings.height = 60;
			settings.spritewidth = 148;
			settings.spriteheight = 60;

			this.parent(x, y, settings);
			this.alwaysUpdate = true;
			this.gravity = 5;
			this.updateTime = false;
			this.type = 'hit';
			this.renderable.alpha = 0;
			this.ac = new me.Vector2d(-this.gravity, 0);
		},

		update: function() {
			// mechanics
			this.pos.add(this.ac);
			if (this.pos.x < -148) {
				me.game.world.removeChild(this);
			}
			return true;
		},

	});
}

HitEntity.prototype.get = function(x, y) {
	return new this.ctor(x, y);
}

bearcat.module(HitEntity, typeof module !== 'undefined' ? module : {});