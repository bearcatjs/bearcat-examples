var BmwCarController = function() {
	this.$id = "bmwCarController";
	this.$bmwCar = null;
}

BmwCarController.prototype.run = function() {
	this.$bmwCar.run();
}

bearcat.module(BmwCarController, typeof module !== 'undefined' ? module : {});