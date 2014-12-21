var Share = function() {
	this.$id = "share";
	this.$init = "init";
	this.ctor = null;
}

Share.prototype.init = function() {
	this.ctor = me.GUI_Object.extend({
		init: function(x, y) {
			var settings = {};
			settings.image = "share";
			settings.spritewidth = 150;
			settings.spriteheight = 75;
			this.parent(x, y, settings);
		},

		onClick: function(event) {
			var shareText = 'Just made ' + game.data.steps + ' steps on Clumsy Bird! Can you beat me? Try online here!';
			var url = 'http://ellisonleao.github.io/clumsy-bird/';
			FB.ui({
				method: 'feed',
				name: 'My Clumsy Bird Score!',
				caption: "Share to your friends",
				description: (
					shareText
				),
				link: url,
				picture: 'http://ellisonleao.github.io/clumsy-bird/data/img/clumsy.png'
			});
			return false;
		}

	});
}

Share.prototype.get = function(x, y) {
	return new this.ctor(x, y);
}

bearcat.module(Share, typeof module !== 'undefined' ? module : {});