var PrintUtil = function() {
	this.$id = "printUtil";
}

PrintUtil.prototype.printResult = function(msg) {
	var d = document.createElement('div');
	d.innerHTML = "<p>" + msg + "</p>";
	document.getElementById('main').appendChild(d);
}

bearcat.module(PrintUtil, typeof module !== 'undefined' ? module : {});