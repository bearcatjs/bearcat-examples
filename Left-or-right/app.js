var bearcat = require('bearcat');

var contextPath = require.resolve('./context.json');

global.bearcat = bearcat;
bearcat.createApp([contextPath]);
bearcat.start(function() {
	var car = bearcat.getBean('car');
	car.run();
});