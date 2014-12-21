var BenzCar = function() {
	this.$id = "benzCar";
	this.$benzEngine = null;
	this.$benzWheel = null;
	this.$printUtil = null;
}

BenzCar.prototype.run = function() {
	this.$benzEngine.start();
	this.$benzWheel.run();
	var msg = 'benzCar run...';
	console.log(msg);
	this.$printUtil.printResult(msg);
}

bearcat.module(BenzCar, typeof module !== 'undefined' ? module : {});