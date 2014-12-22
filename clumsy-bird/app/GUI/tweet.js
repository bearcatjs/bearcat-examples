var Tweet = function() {
	this.$id = "tweet";
	this.$init = "init";
	this.ctor = null;
}

Tweet.prototype.init = function() {
	this.ctor = me.GUI_Object.extend({
		init: function(x, y) {
			var settings = {};
			settings.image = "tweet";
			settings.spritewidth = 152;
			settings.spriteheight = 75;
			this.parent(x, y, settings);
		},

		onClick: function(event) {
			var shareText = 'Just made ' + game.data.steps + ' steps on Clumsy Bird! Can you beat me? Try online here!';
			var url = 'http://ellisonleao.github.io/clumsy-bird/';
			var hashtags = 'clumsybird,melonjs'
			window.open('https://twitter.com/intent/tweet?text=' + shareText + '&hashtags=' + hashtags + '&count=' + url + '&url=' + url, 'Tweet!', 'height=300,width=400')
			return false;
		}

	});
}

Tweet.prototype.get = function(x, y) {
	return new this.ctor(x, y);
}

bearcat.module(Tweet, typeof module !== 'undefined' ? module : {});