var PolyfillUtil = function() {
	this.$id = "polyfillUtil";
	this.$init = "init";
}

PolyfillUtil.prototype.init = function() {
	this.animframePolyfill();
	this.bindPolyfill();
	this.classlistPolyfill();
}

PolyfillUtil.prototype.animframePolyfill = function() {
	var lastTime = 0;
	var vendors = ['webkit', 'moz'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
			window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
					callback(currTime + timeToCall);
				},
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
}

PolyfillUtil.prototype.bindPolyfill = function() {
	Function.prototype.bind = Function.prototype.bind || function(target) {
		var self = this;
		return function(args) {
			if (!(args instanceof Array)) {
				args = [args];
			}
			self.apply(target, args);
		};
	};
}

PolyfillUtil.prototype.classlistPolyfill = function() {
	if (typeof window.Element === "undefined" ||
		"classList" in document.documentElement) {
		return;
	}

	var prototype = Array.prototype,
		push = prototype.push,
		splice = prototype.splice,
		join = prototype.join;

	function DOMTokenList(el) {
		this.el = el;
		// The className needs to be trimmed and split on whitespace
		// to retrieve a list of classes.
		var classes = el.className.replace(/^\s+|\s+$/g, '').split(/\s+/);
		for (var i = 0; i < classes.length; i++) {
			push.call(this, classes[i]);
		}
	}

	DOMTokenList.prototype = {
		add: function(token) {
			if (this.contains(token)) return;
			push.call(this, token);
			this.el.className = this.toString();
		},
		contains: function(token) {
			return this.el.className.indexOf(token) != -1;
		},
		item: function(index) {
			return this[index] || null;
		},
		remove: function(token) {
			if (!this.contains(token)) return;
			for (var i = 0; i < this.length; i++) {
				if (this[i] == token) break;
			}
			splice.call(this, i, 1);
			this.el.className = this.toString();
		},
		toString: function() {
			return join.call(this, ' ');
		},
		toggle: function(token) {
			if (!this.contains(token)) {
				this.add(token);
			} else {
				this.remove(token);
			}

			return this.contains(token);
		}
	};

	window.DOMTokenList = DOMTokenList;

	function defineElementGetter(obj, prop, getter) {
		if (Object.defineProperty) {
			Object.defineProperty(obj, prop, {
				get: getter
			});
		} else {
			obj.__defineGetter__(prop, getter);
		}
	}

	defineElementGetter(HTMLElement.prototype, 'classList', function() {
		return new DOMTokenList(this);
	});
}

bearcat.module(PolyfillUtil, typeof module !== 'undefined' ? module : {});