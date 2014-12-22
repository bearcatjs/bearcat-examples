var Container = function() {
	this.$id = "container";
	this.$init = "init";
	this.$scoreItem = null;
	this.ctor = null;
}

Container.prototype.init = function() {
	var scoreItem = this.$scoreItem;
	this.ctor = me.ObjectContainer.extend({
		init: function() {
			// call the constructor
			this.parent();

			// persistent across level change
			this.isPersistent = true;

			// non collidable
			this.collidable = false;

			// make sure our object is always draw first
			this.z = Infinity;

			// give a name
			this.name = "HUD";

			// add our child score object at the top left corner
			// this.addChild(new game.HUD.ScoreItem(5, 5));
			this.addChild(scoreItem.get(5, 5));
		}
	});
}

Container.prototype.get = function() {
	return new this.ctor();
}

bearcat.module(Container, typeof module !== 'undefined' ? module : {});