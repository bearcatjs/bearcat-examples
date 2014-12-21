var BmwCar = function() {
	this.$id = "bmwCar";
	this.$bmwEngine = null;
	this.$bmwWheel = null;
	this.$printUtil = null;
}

BmwCar.prototype.run = function() {
	this.$bmwEngine.start();
	this.$bmwWheel.run();
	var msg = 'bmwCar run...';
	console.log(msg);
	this.$printUtil.printResult(msg);
}

bearcat.module(BmwCar, typeof module !== 'undefined' ? module : {});