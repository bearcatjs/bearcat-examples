define(function(require) {
	var Engine = require('./engine');

	var Car = function() {
		this.engine = new Engine();
	}

	Car.prototype.run = function() {
		this.engine.run();
		console.log('run car...');
	}

	return Car;
});