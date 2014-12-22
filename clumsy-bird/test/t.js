var Car = function() {

}

Car.prototype.init = function() {
	return {
		// run: this.run.bind(this)
		num: 1,
		run: function() {
			console.log(this.num);
			this.num = 2;
			console.log(this);
		}
	}
}

Car.prototype.run = function() {
	this.num = 1;
}

var car = new Car();
var c = car.init();
c.run();
// console.log(c.run.toString());
console.log(car);