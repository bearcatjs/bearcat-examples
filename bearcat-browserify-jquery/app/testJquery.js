var TestJquery = function() {
	this.$id = "testJquery";
	this.$requireUtil = null;
}

TestJquery.prototype.go = function() {
	var $ = this.$requireUtil.$; // get jQuery
	console.log($);
}

bearcat.module(TestJquery, typeof module !== 'undefined' ? module : {});