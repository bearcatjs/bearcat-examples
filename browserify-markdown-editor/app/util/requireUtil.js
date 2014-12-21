var RequireUtil = function() {
	this.$id = "requireUtil";
	this.$init = "init";
	this.peacock = null;
	this.marked = null;
	this.brace = null;
}

RequireUtil.prototype.init = function() {
	var hyperwatch = require('hyperwatch');
	var peacock = require('peacock');
	this.peacock = peacock;
	this.marked = require('marked');
	this.brace = require('brace');
	require('brace/mode/markdown');
	require('brace/theme/monokai');
	var fs = require('fs');

	this.marked.setOptions({
		gfm: true,
		pedantic: false,
		sanitize: true,
		highlight: function(code, lang) {
			if (!lang) return code;
			try {
				return peacock.highlight(code);
			} catch (e) {
				return code;
			}
		}
	})
}

RequireUtil.prototype.getInitMd = function() {
	var md = fs.readFileSync(__dirname + '/../../README.md');
	return md;
}

bearcat.module(RequireUtil, typeof module !== 'undefined' ? module : {});