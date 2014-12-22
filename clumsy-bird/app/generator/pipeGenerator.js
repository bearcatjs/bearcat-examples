var PipeGenerator = function() {
	this.$id = "pipeGenerator";
	this.$init = "init";
}

PipeGenerator.prototype.init = function() {
	this.ctor = me.Renderable.extend({
		init: function() {
			this.parent(new me.Vector2d(), me.game.viewport.width, me.game.viewport.height);
			this.alwaysUpdate = true;
			this.generate = 0;
			this.pipeFrequency = 92;
			this.pipeHoleSize = 1240;
			this.posX = me.game.viewport.width;
		},

		update: function(dt) {
			if (this.generate++ % this.pipeFrequency == 0) {
				var posY = Number.prototype.random(
					me.video.getHeight() - 100,
					200
				);
				var posY2 = posY - me.video.getHeight() - this.pipeHoleSize;
				var pipe1 = new me.pool.pull("pipe", this.posX, posY);
				var pipe2 = new me.pool.pull("pipe", this.posX, posY2);
				var hitPos = posY - 100;
				var hit = new me.pool.pull("hit", this.posX, hitPos);
				pipe1.renderable.flipY();
				me.game.world.addChild(pipe1, 10);
				me.game.world.addChild(pipe2, 10);
				me.game.world.addChild(hit, 11);
			}
			return true;
		},

	});
}

PipeGenerator.prototype.get = function() {
	return new this.ctor();
}

bearcat.module(PipeGenerator, typeof module !== 'undefined' ? module : {});