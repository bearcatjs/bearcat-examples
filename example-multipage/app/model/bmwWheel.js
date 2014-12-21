var BmwWheel = function() {
	this.$id = "bmwWheel";
	this.$printUtil = null;
}

BmwWheel.prototype.run = function() {
	var msg = 'bmwWheel run...';
	console.log(msg);
	this.$printUtil.printResult(msg);
}

bearcat.module(BmwWheel, typeof module !== 'undefined' ? module : {});