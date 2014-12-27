var Naughty = function(count, radius, blockSide, backCanvas, scale, gatherDuration, scatterDuration) {
	this.$id = "naughty";
	this.$scope = "prototype";
	this.$colorBox = null;
	this.count = count;
	this.radius = radius;
	this.blockSide = blockSide;
	this.fadeFactor = 5;
	this.windX = Math.sin(Math.random() * 360) * 3;
	this.windY = Math.cos(Math.random() * 360) * 3;
	this.text = "";
	this.scale = scale;

	this.backCanvas = backCanvas;
	this.canvasContext = backCanvas.getContext("2d");
	var w = backCanvas.width;
	var h = backCanvas.height;

	// var c0 = {
	//   // steelblue
	//   r:70,
	//   g:130,
	//   b:180
	// };

	var c0 = {
		// steelblue
		r: 70,
		g: 130,
		b: 180
	};

	var c1 = {
		// orangered
		r: 255,
		g: 69,
		b: 0
	};

	var colors = [c0, c1];
	c0.vr = (c1.r - c0.r) / gatherDuration;
	c0.vg = (c1.g - c0.g) / gatherDuration;
	c0.vb = (c1.b - c0.b) / gatherDuration;
	c1.vr = (c0.r - c1.r) / scatterDuration;
	c1.vg = (c0.g - c1.g) / scatterDuration;
	c1.vb = (c0.b - c1.b) / scatterDuration;

	this.colors = colors;
	this.color = {
		r: c0.r,
		g: c0.g,
		b: c0.b
	};

	var elementArray = new Array(count);
	for (var i = 0; i < count; ++i) {
		elementArray[i] =
			this.getCircle(Math.floor(Math.random() * w),
				Math.floor(Math.random() * h),
				radius);
	}

	this.elementArray = elementArray;


	this.elapse = 0;
	this.gatherDuration = gatherDuration;
	this.scatterDuration = scatterDuration;

	this.current = this._idleState;
}

Naughty.prototype.getCircle = function(x, y, r, color) {
	function Circle(x, y, r, color) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.fateX = -10;
		this.fateY = -10;
		this.destX = -10;
		this.destY = -10;
		this.alpha = 0;
		this.vx = Math.random() - .5 * 5;
		this.vy = Math.random() - .5 * 5;

	}

	return new Circle(x, y, r, color);
}

Naughty.prototype._idleState = function() {
	if (0 <= this.elapse) {
		this.gather();
		this.current = this._gatherState;
	}
};

Naughty.prototype._gatherState = function() {
	if (this.gatherDuration <= this.elapse) {
		this.scatter();
		this.current = this._scatterState;
	}
};

Naughty.prototype._scatterState = function() {
	if ((this.gatherDuration + this.scatterDuration) <= this.elapse) {
		this.elapse = 0;
		this.current = this._idleState;
	}
};

Naughty.prototype.drawTextTemplate = function(text, x, y) {
	this.text = text;
	var ctx = this.canvasContext;

	ctx.clearRect(0, 0,
		this.backCanvas.width,
		this.backCanvas.height);

	ctx.fillStyle = "red";

	//ctx.font="36pt Verdana,san-serif";
	ctx.font = "36pt Verdana, Courier New";
	ctx.fillText(this.text, x, y);

	var imageData = ctx.getImageData(0, 0,
		this.backCanvas.width,
		this.backCanvas.height);

	var imageWidth = Math.floor(imageData.width);
	var imageHeight = Math.floor(imageData.height);

	var blockSide = this.blockSide; // default 4
	var area = (blockSide * blockSide);
	var centerOffset = Math.floor(blockSide / 2);
	var assignedCount = 0;
	var threshold = 60

	for (var j = 0; j < imageHeight; j = j + blockSide) {
		for (var i = 0; i < imageHeight; i = i + blockSide) {
			var sum = 0;
			for (var ypos = j; ypos < j + blockSide; ++ypos) {
				for (var xpos = i; xpos < i + blockSide; ++xpos) {
					var index = (xpos * 4) * imageData.width + (ypos * 4);
					var red = imageData.data[index];
					sum += red;
				}
			}

			var average = sum / area;
			var ea = this.elementArray;

			if (average > threshold && assignedCount < ea.length) {
				ea[assignedCount].fateX = (j + centerOffset) * this.scale;
				ea[assignedCount].fateY = (i + centerOffset) * this.scale;
				++assignedCount;
			}
		}
	}

	for (var i = assignedCount; i < ea.length; ++i) {
		ea[i].fateX = -10;
		ea[i].fateY = -10;
	}
}

Naughty.prototype.gather = function() {
	var ea = this.elementArray;
	for (var i = 0; i < ea.length; ++i) {
		ea[i].destX = ea[i].fateX;
		ea[i].destY = ea[i].fateY;
	}
}

Naughty.prototype.scatter = function() {
	var windForce = 0;
	this.windX = 0; //Math.sin(Math.random() * Math.PI * 2) * windForce;
	this.windY = 0; //Math.cos(Math.random() * Math.PI * 2) * windForce;
	var ea = this.elementArray;
	for (var i = 0; i < ea.length; ++i) {
		var angle = Math.random() * Math.PI * 2;
		var dir = Math.sin(angle);
		var minv = 2.5;
		if (dir < 0) {
			dir += -minv;
		} else {
			dir += minv;
		}
		ea[i].vx = dir * this.fadeFactor;
		ea[i].vy = (0 + Math.cos(angle)) * this.fadeFactor;
		ea[i].destX = -10;
		ea[i].destY = -10;
	}
}

Naughty.prototype._doUpdate = function(dt) {
	var ea = this.elementArray;
	var colors = this.colors;

	if (this.current === this._gatherState) {
		var leftTime = (0.5 * this.gatherDuration - this.elapse);
		var factor = 0;
		if (leftTime <= 0) {
			factor = 1;
		} else {
			factor = dt / leftTime;
		}

		this.color.r += (colors[1].r - this.color.r) * factor;
		this.color.g += (colors[1].g - this.color.g) * factor;
		this.color.b += (colors[1].b - this.color.b) * factor;

	} else if (this.current === this._scatterState) {
		var leftTime = (this.gatherDuration + this.scatterDuration - this.elapse);
		var factor = 0;
		if (leftTime <= 0) {
			factor = 1;
		} else {
			factor = dt / leftTime;
		}

		this.color.r += (colors[0].r - this.color.r) * factor;
		this.color.g += (colors[0].g - this.color.g) * factor;
		this.color.b += (colors[0].b - this.color.b) * factor;
	}

	var tf = dt / 30;
	var fade = Math.pow(0.95, tf);
	var damping = Math.pow(0.99, tf);

	for (var i = 0; i < ea.length; ++i) {
		var e = ea[i];

		if (e.destX >= 0) {
			var dx = e.destX - e.x;
			var dy = e.destY - e.y;
			var d = Math.sqrt(dx * dx + dy * dy);

			e.x += (dx / 4 + (dx / 120 * e.vx) + this.windX) * tf;
			e.y += (dy / 6 + (dy / 120 * e.vy) + this.windY) * tf;
			e.alpha += ((1.0 - e.alpha) / 2) * tf;
			if (e.alpha > 1) {
				e.alpha = 1;
			}
		} else {
			e.x += (e.vx + this.windX) * tf;
			e.y += (e.vy + this.windY) * tf;
			e.vy += 0.5 * tf; // gravity
			e.alpha *= fade;
			if (e.alpha < 0) {
				e.alpha = 0;
			}
		}

		this.windX *= damping;
		this.windY *= damping;

		if (e.x < 0) {
			e.x = -e.x;
			e.vx = -e.vx;
		}

		if (e.y < 0) {
			e.y = -e.y;
			e.vy = -e.vy;
		};

		var w = this.backCanvas.width;
		var h = this.backCanvas.height;

		if (e.x > w) {
			e.x = w - (e.x - w);
			e.vx = -e.vx;
		}

		if (e.y > h) {
			e.y = h - (e.y - h);
			e.vy = -e.vy * 0.45;
		}
	}
}

Naughty.prototype.update = function(dt) {
	this.current();
	this._doUpdate(dt);
	this.elapse += dt;
}

Naughty.prototype.draw = function(ctx) {
	var c = 'rgb(' + Math.floor(this.color.r) + ',' +
		Math.floor(this.color.g) +
		',' + Math.floor(this.color.b) + ')';

	ctx.fillStyle = c;

	var ea = this.elementArray;
	for (var i = 0; i < ea.length; ++i) {
		var e = ea[i];
		ctx.globalAlpha = e.alpha;
		ctx.beginPath();
		//ctx.fillStyle = "#7f007f";
		ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2, true);
		//ctx.closePath();
		ctx.fill();
	}
}

bearcat.module(Naughty, typeof module !== 'undefined' ? module : {});