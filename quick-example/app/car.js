var Car = function() {
	this.$id = "car";
	this.$engine = null;
	this.$wheel = null;
}

Car.prototype.run = function() {
	this.$engine.run();
	this.$wheel.run();
	console.log('run car...');
}

bearcat.module(Car, typeof module !== 'undefined' ? module : {});