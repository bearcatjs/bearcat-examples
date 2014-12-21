var BmwEngine = function() {
	this.$id = "bmwEngine";
	this.$printUtil = null;
}

BmwEngine.prototype.start = function() {
	var msg = 'bmwEngine start...';
	console.log(msg);
	this.$printUtil.printResult(msg);
}

bearcat.module(BmwEngine, typeof module !== 'undefined' ? module : {});