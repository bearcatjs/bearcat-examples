'use strict';
var browserify = require('browserify');

var go = module.exports = function() {
	return browserify()
		.require(require.resolve('./app'), {
			entry: true
		})
		.transform('brfs')
		.bundle({
			// debug: true
		});
};

// Test
if (!module.parent) {
	go().pipe(process.stdout);
}