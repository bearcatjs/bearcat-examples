var BirdEntity = function() {
	this.$id = "birdEntity";
	this.$init = "init";
	this.ctor = null;
}

BirdEntity.prototype.init = function() {
	this.ctor = me.ObjectEntity.extend({
		init: function(x, y) {
			var settings = {};
			settings.image = me.loader.getImage('clumsy');
			settings.width = 85;
			settings.height = 60;
			settings.spritewidth = 85;
			settings.spriteheight = 60;

			this.parent(x, y, settings);
			this.alwaysUpdate = true;
			this.gravity = 0.2;
			this.gravityForce = 0.01;
			this.maxAngleRotation = Number.prototype.degToRad(30);
			this.maxAngleRotationDown = Number.prototype.degToRad(90);
			this.renderable.addAnimation("flying", [0, 1, 2]);
			this.renderable.addAnimation("idle", [0]);
			this.renderable.setCurrentAnimation("flying");
			this.renderable.anchorPoint = new me.Vector2d(0.2, 0.5);
			this.animationController = 0;
			// manually add a rectangular collision shape
			this.addShape(new me.Rect(new me.Vector2d(5, 5), 70, 50));

			// a tween object for the flying physic effect
			this.flyTween = new me.Tween(this.pos);
			this.flyTween.easing(me.Tween.Easing.Exponential.InOut);

			this.endTween = new me.Tween(this.pos);
			this.flyTween.easing(me.Tween.Easing.Exponential.InOut);
		},

		update: function(dt) {
			// mechanics
			if (!game.data.start) {
				return this.parent(dt);
			}
			if (me.input.isKeyPressed('fly')) {
				me.audio.play('wing');
				this.gravityForce = 0.02;

				var currentPos = this.pos.y;
				// stop the previous one
				this.flyTween.stop();
				this.flyTween.to({
					y: currentPos - 72
				}, 100);
				this.flyTween.start();

				this.renderable.angle = -this.maxAngleRotation;
			} else {
				this.gravityForce += 0.2;
				this.pos.y += me.timer.tick * this.gravityForce;
				this.renderable.angle += Number.prototype.degToRad(3) * me.timer.tick;
				if (this.renderable.angle > this.maxAngleRotationDown)
					this.renderable.angle = this.maxAngleRotationDown;
			}

			var res = me.game.world.collide(this);
			var collided = false;

			if (res) {
				if (res.obj.type === 'pipe' || res.obj.type === 'ground') {
					me.device.vibrate(500);
					collided = true;
				}
				// remove the hit box
				if (res.obj.type === 'hit') {
					me.game.world.removeChildNow(res.obj);
					// the give dt parameter to the update function
					// give the time in ms since last frame
					// use it instead ?
					game.data.steps++;
					me.audio.play('hit');
				}

			}
			// var hitGround = me.game.viewport.height - (96 + 60);
			var hitSky = -80; // bird height + 20px
			if (this.pos.y <= hitSky || collided) {
				game.data.start = false;
				me.audio.play("lose");
				this.endAnimation();
				return false;
			}
			return this.parent(dt);
		},

		endAnimation: function() {
			me.game.viewport.fadeOut("#fff", 100);
			var that = this;
			var currentPos = this.pos.y;
			this.flyTween.stop();
			this.renderable.angle = this.maxAngleRotationDown;
			this.endTween
				.to({
					y: currentPos - 72
				}, 1500)
				.to({
					y: me.video.getHeight() - 96 - that.renderable.width
				}, 500)
				.onComplete(function() {
					me.state.change(me.state.GAME_OVER);
				});
			this.endTween.start();
			return false;
		}

	});
}

BirdEntity.prototype.get = function(x, y) {
	return new this.ctor(x, y);
}

bearcat.module(BirdEntity, typeof module !== 'undefined' ? module : {});