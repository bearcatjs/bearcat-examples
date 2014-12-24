var RequireUtil = function() {
	this.$id = "requireUtil";
	this.$init = "init"; // nice, sweet init hook
	this.$ = null;
}

RequireUtil.prototype.init = function() {
	var $ = require('jquery');
	this.$ = $;
}

bearcat.module(RequireUtil, typeof module !== 'undefined' ? module : {});