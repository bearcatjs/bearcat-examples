var ScoreItem = function() {
	this.$id = "scoreItem";
	this.$init = "init";
	this.ctor = null;
}

ScoreItem.prototype.init = function() {
	this.ctor = me.Renderable.extend({
		/**
		 * constructor
		 */
		init: function(x, y) {

			// call the parent constructor
			// (size does not matter here)
			this.parent(new me.Vector2d(x, y), 10, 10);

			// local copy of the global score
			this.stepsFont = new me.Font('gamefont', 80, '#000', 'center');

			// make sure we use screen coordinates
			this.floating = true;
		},

		update: function() {
			return true;
		},

		draw: function(context) {
			if (game.data.start && me.state.isCurrent(me.state.PLAY))
				this.stepsFont.draw(context, game.data.steps, me.video.getWidth() / 2, 10);
		}

	});
}

ScoreItem.prototype.get = function(x, y) {
	return new this.ctor(x, y);
}

bearcat.module(ScoreItem, typeof module !== 'undefined' ? module : {});