var BenzCarController = function() {
	this.$id = "benzCarController";
	this.$benzCar = null;
}

BenzCarController.prototype.run = function() {
	this.$benzCar.run();
}

bearcat.module(BenzCarController, typeof module !== 'undefined' ? module : {});