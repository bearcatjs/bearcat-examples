var BenzEngine = function() {
	this.$id = "benzEngine";
	this.$printUtil = null;
}

BenzEngine.prototype.start = function() {
	var msg = 'benzEngine start...';
	console.log(msg);
	this.$printUtil.printResult(msg);
}

bearcat.module(BenzEngine, typeof module !== 'undefined' ? module : {});