var Car = function() {
	this.$id = "car";
	this.$engine = null;
}

Car.prototype.run = function() {
	this.$engine.run();
	console.log('run car...');
}

bearcat.module(Car, typeof module !== 'undefined' ? module : {});