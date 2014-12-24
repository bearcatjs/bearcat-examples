var bearcat = require('bearcat');
window.bearcat = bearcat; // make bearcat global
bearcat.createApp();

require('./bearcat-bootstrap');
require('./app/requireUtil'); // magic javaScript object needs to use 'require', add to browserify bundle
bearcat.use(['testJquery']); // load markDownController
bearcat.start(function() {
	var testJquery = bearcat.getBean('testJquery');
	testJquery.go();
});