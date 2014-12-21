var bearcat = require('bearcat');
window.bearcat = bearcat; // make bearcat global
bearcat.createApp();

require('./bearcat-bootstrap');
require('./app/util/requireUtil'); // magic javaScript object needs to use 'require', add to browserify bundle
bearcat.use(['markDownController']); // load markDownController
bearcat.start(function() {

});