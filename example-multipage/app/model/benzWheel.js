var BenzWheel = function() {
	this.$id = "benzWheel";
	this.$printUtil = null;
}

BenzWheel.prototype.run = function() {
	var msg = 'benzWheel run...';
	console.log(msg);
	this.$printUtil.printResult(msg);
}

bearcat.module(BenzWheel, typeof module !== 'undefined' ? module : {});