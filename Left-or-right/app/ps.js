if (typeof __resources__ === "undefined") {
	var __resources__ = {}
}

__resources__["/ps.js"] = {
	meta: {
		mimetype: "application/javascript"
	},
	data: function(exports, require, module, __filename, __dirname) {
		var debug = require("debug");
		var geo = require("geometry");
		var Actor = require("node").Actor;
		var m = require("model");

		var isSamePstn = function(p1, p2) {
			return Math.abs(p1.x - p2.x) <= 3 && Math.abs(p1.y - p2.y) <= 3;
		};

		var pstnsIdxOf = function(p, pa) {
			var idx = -1;
			pa.some(function(pai, i) {
				if (isSamePstn(p, pai.pstn)) {
					idx = i;
					return true;
				};

				return false;
			});
			return idx;
		};

		var getMapPaths = function(svgDoc) {
			var paths = svgDoc.getElementsByTagName("path");

			var ret = Array.prototype.map.call(paths, function(p) {
				return p;
			});
			return ret;
		};

		/*
		d="m 244.6088,181.99712 c 25.20223,-12.21894 52.48967,-47.40738 81.23202,-38.79058     32.1616,9.64187 74.40063,46.50234 52.02501,86.25199 -22.37562,39.74965 -172.96033,0.45636 -172.96033,0.45636"
		*/
		var parsePath = function(svgPathEle) {
			var d = svgPathEle.getAttribute("d").split(" ");
			debug.assert(d[0] == "m", "cannot parse the svgpathelement");

			var bRelative = d[2] == "c";

			var ret = [];

			var lastEndPstn = d[1];

			var index = 3;
			while (1) {
				ret.push(lastEndPstn); //start pstn
				ret.push(d[index]); //control 1
				ret.push(d[index + 1]); //control 2
				ret.push(d[index + 2]); //end pstn

				lastEndPstn = d[index + 2];
				index += 3;

				if ((index + 3) > d.length)
					break;
			}

			ret = ret.map(function(pstn) {
				var pstns = pstn.split(",").map(function(s) {
					return parseFloat(s);
				});

				return {
					x: pstns[0],
					y: pstns[1]
				};
			});

			if (bRelative) {
				var relativePstn = ret[0];

				for (var i = 1; i < ret.length; i++) {
					ret[i].x += relativePstn.x;
					ret[i].y += relativePstn.y;
				}
			}

			return ret;
		}

		var parsePath = function(svgPathEle) {
			var d = svgPathEle.getAttribute("d").split(" ");

			var startPstn = d[1].split(",").map(function(s) {
				return parseFloat(s)
			});
			startPstn = {
				x: startPstn[0],
				y: startPstn[1]
			};

			var controlPstn1 = d[3].split(",").map(function(s) {
				return parseFloat(s)
			});
			controlPstn1 = {
				x: controlPstn1[0],
				y: controlPstn1[1]
			};

			var controlPstn2 = d[4].split(",").map(function(s) {
				return parseFloat(s)
			});
			controlPstn2 = {
				x: controlPstn2[0],
				y: controlPstn2[1]
			};

			var endPstn = d[5].split(",").map(function(s) {
				return parseFloat(s)
			});

			endPstn = {
				x: endPstn[0],
				y: endPstn[1]
			};

			if (d[2] == "C")
				return {
					start: startPstn,
					control: [controlPstn1, controlPstn2],
					end: endPstn
				};
			else
				return {
					start: startPstn,
					control: [geo.ccpAdd(controlPstn1, startPstn), geo.ccpAdd(controlPstn2, startPstn)],
					end: geo.ccpAdd(startPstn, endPstn)
				};
		};

		var colorMap = {
			red: "rgba(255, 0, 0, 1)",
			green: "rgba(0, 255, 0, 1)",
			blue: "rgba(0, 0, 255, 1)",
			orangered: "rgba(255, 69, 0, 1)",
			steelblue: "rgba(70, 130, 180, 1)"
		};

		/*
		 *  train, traincolor, speed, opposite
		 *  mainroad, curbranch
		 *  用来表示这表路径是列车的target
		 *  target:trainNum
		 *  targetcolor:"red"
		 *  targetPosition:"start"/"end"
		 */

		var initPathProperty = function(path) {
			path.userProps = {};

			var desc = path.getAttribute("inkscape:label");
			if (!desc)
				return;

			Array.prototype.forEach.call(desc.split(","),
				function(prop) {
					var p = prop.split(":");
					var name = p[0].trim();
					var val = p[1].trim();

					//now just support true, false, number
					if (val == "true")
						val = true;
					else if (val == "false")
						val = false;
					else if (parseInt(val) == val)
						val = parseInt(val);
					else if (parseFloat(val) == val)
						val = parseFloat(val);
					else if (colorMap[val] != undefined)
						val = colorMap[val];

					path.userProps[name] = val;
				});
		};

		//extend SVGPathElement
		var initSVGPathElement = function(p) {
			p.isMainRoad = function() {
				return this.userProps.mainroad == true;
				// var label = this.getAttribute("inkscape:label");
				// if (label && label.search("mainroad") != -1)
				//    return true;
				// return false;
			};

			p.initPathData = function() {
				var pstns = parsePath(this);
				this._startPstn = pstns.start;
				this._endPstn = pstns.end;
				this._controlPstns = pstns.control;
				this._pstns = [pstns.start, pstns.control[0], pstns.control[1], pstns.end];

				initPathProperty(this);

				return true;
			};

			p.getStartPstn = function() {
				if (this._startPstn == undefined)
					this.initPathData();

				return this._startPstn;
			};

			p.getEndPstn = function() {
				if (this._endPstn == undefined)
					this.initPathData();

				return this._endPstn;
			};

			p.getControlPstns = function() {
				if (this._controlPstns == undefined)
					this.initPathData();

				return this._controlPstns;
			};

			p.getPstns = function() {
				if (this._pstns == undefined)
					this.initPathData();

				return this._pstns;
			};

			p.getId = function() {
				return this.id;
			};

			p.isCurrentBranch = function() {
				return this.userProps.curbranch == true;
				// var label = this.getAttribute("inkscape:label");
				// if (label && label.search("curbranch") != -1)
				//    return true;
				// return false;
			};
		};

		//helper util
		var getRadianByVector = function(vector) {
			var xaxis = {
				x: 1,
				y: 0
			};

			var cos = vector.x * xaxis.x + vector.y * xaxis.y;
			var mod = Math.sqrt(vector.x * vector.x + vector.y * vector.y) * Math.sqrt(xaxis.x * xaxis.x + xaxis.y * xaxis.y);

			var radian = Math.acos(cos / mod);

			//这里得到的弧度始终是两个向量夹角（0<=r<=180),当位于3,4象限的时候，需要转换成对应的角度
			if ((vector.x < 0 && vector.y < 0) || (vector.x > 0 && vector.y < 0)) {
				radian = Math.PI * 2 - radian;
			}

			return radian;
		};

		var PS = function() {};

		PS.prototype.paint = function(painter) {
			debug.assert(false, "cannot be here");
		};
		PS.prototype.drive = function(train, startP, prevPS) {
			debug.assert(false, "cannot be here");
		};
		PS.prototype.traverseDown = function(train, prevEndP, prevPS) {
			debug.assert(false, "cannot be here");
		};
		PS.prototype.getConnectedPS = function() {
			debug.assert(false, "cannot be here!")
		};

		var paintps = function(m, painter) {
			var ctx = painter.exec("sketchpad");

			var allps = getAllPS(m.slot("ps"));
			//change hashmap to array
			allps = Object.keys(allps).map(function(id) {
				return allps[id];
			});

			//first： draw all path
			allps.filter(function(ps) {
					return ps.type == "path";
				})
				.forEach(function(path) {
					path.paint(painter);
				});

			//second: draw all target point
			allps.filter(function(ps) {
					return ps.type == "path" && ps.svgPathEle.userProps.target != undefined;
				})
				.forEach(function(path) {
					var pstn = path.svgPathEle.userProps.targetposition == "start" ? path.svgPathEle.getStartPstn() : path.svgPathEle.getEndPstn();
					var color = path.svgPathEle.userProps.targetcolor;
					ctx.save();
					ctx.fillStyle = color;
					ctx.beginPath();
					ctx.arc(pstn.x, pstn.y, 8, 0, Math.PI * 2);
					ctx.fill();
					ctx.restore();
				});

			//third： draw all switcher
			//之后switcher会通过actor去绘制，这里就不需要了。
			allps.filter(function(ps) {
					return ps.type == "switcher";
				})
				.forEach(function(switcher) {
					switcher.paint(painter);
				});
		};

		var getAllPS = function(ps) {
			var _getAllPS = function(ps, recordedPS) {
				if (recordedPS[ps.identifier])
					return;

				recordedPS[ps.identifier] = ps;

				ps.getConnectedPS().forEach(function(p) {
					_getAllPS(p, recordedPS);
				});
			}

			var recordedPS = {};
			_getAllPS(ps, recordedPS);

			return recordedPS;
		};

		require('painter').HonestPainter.register('ps', {
			bbox: function() {
				return geo.rectMake(0, 0, 0, 0);
			},
			draw: paintps,
			inside: function() {
				return false;
			}
		});

		//WARNING：确保所有的path是一个严格的双向链表（方便绘制等操作。。）
		var Path = function(svgPathEle, prevPs, nextPs) {
			this.svgPathEle = svgPathEle;
			this.prevPs = prevPs;
			this.nextPs = nextPs;

			this.type = "path";
		};

		Path.prototype = new PS();

		Path.prototype.getConnectedPS = function() {
			var ret = [];
			if (this.prevPs)
				ret.push(this.prevPs);
			if (this.nextPs)
				ret.push(this.nextPs);

			return ret;
		};

		//仅仅知道前一段路径是不知道接下来怎么跑，因为可能两端路径就练成了一个圆
		//所以参数应该为path：{start，end}
		Path.prototype.drive = function(train, prevPs, bOpposite) {
			//默认是false
			if (undefined == bOpposite)
				bOpposite = false;

			if (undefined != this.prevPs && prevPs == this.prevPs)
				bOpposite = false;
			else if (undefined != this.nextPs && prevPs == this.nextPs)
				bOpposite = true;

			train.exec("traverse", this, bOpposite);
		};

		Path.prototype.traverseDown = function(train, bOpposite) {
			var ps = bOpposite == true ? this.prevPs : this.nextPs;

			if (train.exec("id") == this.svgPathEle.userProps.target &&
				this.svgPathEle.userProps.target != undefined &&
				this.svgPathEle.userProps.targetcolor != undefined &&
				this.svgPathEle.userProps.targetposition != undefined) {
				//success
				train.exec("success");
			} else if (ps)
				ps.drive(train, this);
			else {
				train.exec("die");
			}
		};

		Path.prototype.getEndpoint = function() {
			return [this.svgPathEle.getStartPstn(), this.svgPathEle.getEndPstn()];
		};

		var paintBezier = function(painter, pstns, lineWidth, strokeStyle) {
			var ctx = painter.exec("sketchpad");

			ctx.save();

			ctx.lineWidth = lineWidth;

			ctx.strokeStyle = strokeStyle;

			ctx.beginPath();
			ctx.moveTo(pstns[0].x, pstns[0].y);
			ctx.bezierCurveTo(pstns[1].x, pstns[1].y, pstns[2].x, pstns[2].y, pstns[3].x, pstns[3].y);

			ctx.stroke();

			ctx.restore();
		};

		Path.prototype.paint = function(painter) {
			var ctx = painter.exec("sketchpad");

			// ctx.lineWidth = 5;

			var startPstn = this.svgPathEle.getStartPstn();
			var endPstn = this.svgPathEle.getEndPstn();
			var controls = this.svgPathEle.getControlPstns();

			paintBezier(painter, this.svgPathEle.getPstns(), 5, "black");
			// ctx.save();
			// ctx.beginPath();
			// ctx.moveTo(startPstn.x, startPstn.y);
			// ctx.bezierCurveTo(controls[0].x, controls[0].y, controls[1].x, controls[1].y, endPstn.x, endPstn.y);
			// ctx.stroke();

			if (this.svgPathEle.userProps.target != undefined) {
				var pstn = this.svgPathEle.userProps.targetposition == "start" ? this.svgPathEle.getStartPstn() : this.svgPathEle.getEndPstn();
				var color = this.svgPathEle.userProps.targetcolor;
				ctx.save();
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(pstn.x, pstn.y, 8, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}

			ctx.restore();
		};

		var Switcher = function(branchPS1, branchPS2, mergePS1, curBranch) {
			this.b1 = branchPS1;
			this.b2 = branchPS2;
			this.m = mergePS1;

			this.mpstns = undefined;
			this.b1pstns = undefined;
			this.b2pstns = undefined;

			if (curBranch)
				this.curBranch = curBranch;
			else
				this.curBranch = this.b1;

			this.type = "switcher";
		};

		Switcher.prototype = new PS();

		Switcher.prototype.doSwitch = function() {
			if (this.curBranch == this.b1)
				this.curBranch = this.b2;
			else
				this.curBranch = this.b1;
		};

		Switcher.prototype.getConnectedPS = function() {
			var ret = [];
			if (this.b1)
				ret.push(this.b1);
			if (this.b2)
				ret.push(this.b2);
			if (this.m)
				ret.push(this.m);

			return ret;
		};

		Switcher.prototype.drive = function(train, prevPS) {
			debug.assert(prevPS == this.b1 || prevPS == this.b2 || prevPS == this.m, "parameter error");

			var bFromBranch = prevPS == this.b1 || prevPS == this.b2;

			if (bFromBranch) {
				if (this.curBranch != prevPS) {
					//火车不能通行
					train.exec("die");
					return;
				}

				this.m.drive(train, this);
			} else {
				this.curBranch.drive(train, this);
			}
		};

		Switcher.prototype.getJointPoint = function() {
			var endpointm = this.m.getEndpoint();
			var endpointb1 = this.curBranch.getEndpoint();

			var jointPoint;
			if (isSamePstn(endpointm[0], endpointb1[0]) || isSamePstn(endpointm[0], endpointb1[1])) {
				jointPoint = endpointm[0];
			} else {
				jointPoint = endpointm[1];
			}

			return jointPoint;
		};

		var paintArrow = function(painter, pstn, radian, poleLen, arrowLen, color) {
			var ctx = painter.exec("sketchpad");
			ctx.save();

			ctx.strokeStyle = color;

			ctx.translate(pstn.x, pstn.y);
			ctx.rotate(radian);

			//pole
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(poleLen, 0);
			ctx.stroke();

			//arrows
			ctx.translate(poleLen, 0);

			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(-arrowLen, arrowLen);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(-arrowLen, -arrowLen);
			ctx.stroke();

			ctx.restore();
		};

		/*
		 * 向量 endPstn - startPstn，在endPstn处画一个直角三角形。
		 * 直角三角形的直角点和endPstn重叠，垂线和向量endPstn - startPstn重叠
		 * 三角形的斜边的长度为 2*width, 三角形的高为height
		 */
		var paintArrow1 = function(painter, startPstn, endPstn, width, height, fillStyle) {
			var ctx = painter.exec("sketchpad");

			var radian = getRadianByVector(geo.ccpSub(endPstn, startPstn));

			ctx.save();
			ctx.fillStyle = fillStyle;

			ctx.translate(endPstn.x, endPstn.y);
			ctx.rotate(radian + Math.PI / 2);

			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(width, height);
			ctx.lineTo(-width, height);
			ctx.lineTo(0, 0);

			ctx.fill();

			ctx.restore();
		};

		var calcBezierPoint = function(p, k) {
			var res = {
				x: 0,
				y: 0
			};

			res.x =
				Math.pow(1 - k, 3) * p[0].x +
				3 * k * Math.pow(1 - k, 2) * p[1].x +
				3 * Math.pow(k, 2) * (1 - k) * p[2].x +
				Math.pow(k, 3) * p[3].x;

			res.y =
				Math.pow(1 - k, 3) * p[0].y +
				3 * k * Math.pow(1 - k, 2) * p[1].y +
				3 * Math.pow(k, 2) * (1 - k) * p[2].y +
				Math.pow(k, 3) * p[3].y;

			return res;
		}


		var cuberoot = function(x) {
			// because Math.pow can not receive negative radix when power is negative
			if (0 <= x) {
				return Math.pow(x, 1 / 3);
			} else {
				return -Math.pow(-x, 1 / 3);
			}
		}

		var calcQuadraticEquation = function(b, c, d, which) {
			var res
			if (0 === b) {
				if (0 === c) {
					res = {
						status: "linear",
						roots: null
					}
				} else {
					res = {
						status: null,
						roots: [-d / c]
					}
				}
			} else {
				// quadratic
				var x = [
					(-c + Math.pow(c * c - 4 * b * d, 0.5)) / (2 * b), (-c - Math.pow(c * c - 4 * b * d, 0.5)) / (2 * b)
				];
				res = {
					status: null,
					roots: x
				}
			}

			res.which = which;
			return res;
		}

		function calcCoefficientOfBezierPoint(p, e) {
			var check = function(a, b, c, d, roots) {
				var threshold = 2.0;

				for (var i = 0; i < roots.length; ++i) {
					var v = a * Math.pow(roots[i], 3) + b * Math.pow(roots[i], 2) + c * roots[i] + d;
					if (Math.abs(v) <= threshold && 0 <= roots[i] && roots[i] <= 1) {
						return roots[i];
					}
				}
			}

			var check2 = function(p, target, roots) {
				var epsilon = 5.0;

				for (var i = 0; i < roots.length; ++i) {
					var guess = calcBezierPoint(p, roots[i]);
					var d2 = Math.pow(guess.x - target.x, 2) + Math.pow(guess.y - target.y, 2);
					var d = Math.sqrt(d2);
					if (d <= epsilon && 0 <= roots[i] && roots[i] <= 1) {
						return roots[i];
					}
				}
			}

			var xa = -p[0].x + 3 * p[1].x - 3 * p[2].x + p[3].x; // f ^ 3
			var xb = 3 * p[0].x - 6 * p[1].x + 3 * p[2].x; // f ^ 2
			var xc = -3 * p[0].x + 3 * p[1].x; // f ^ 1
			var xd = p[0].x - e.x; // f ^ 0

			var ya = -p[0].y + 3 * p[1].y - 3 * p[2].y + p[3].y; // f ^ 3
			var yb = 3 * p[0].y - 6 * p[1].y + 3 * p[2].y; // f ^ 2
			var yc = -3 * p[0].y + 3 * p[1].y; // f ^ 1
			var yd = p[0].y - e.y; // f ^ 0

			var res;
			if (0 === xa) {
				res = calcQuadraticEquation(xb, xc, xd, "x");
			} else if (0 === ya) {
				res = calcQuadraticEquation(yb, yc, yd, "y");
			} else {
				var bb = xb * ya - yb * xa;
				var cc = xc * ya - yc * xa;
				var dd = xd * ya - yd * xa;

				res = calcQuadraticEquation(bb, cc, dd, "xy");
			}

			if (res.status === "linear") {
				var dx = q[3].x - q[0].x;
				var dy = q[3].y - q[0].y;
				var dist = Math.sqrt(dx * dx + dy * dy);

				if (0 === dist) {
					return 0;
				}

				var edx = e.x - q[0].x;
				var edy = e.y - q[0].y;
				var edist = Math.sqrt(edx * edx + edy * edy);

				return edist / dist;
			} else {
				return check2(p, e, res.roots);
			}

			/*
			else if(res.which === "x")
			{
			  return check(ya,yb,yc,yd, res.roots);
			}
			else if(res.which === "y")
			{
			  return check(xa,xb,xc,xd, res.roots);
			}
			else
			{
			  var r = check(xa,xb,xc,xd, res.roots);
			  if (r)
			  {
			    return r;
			  }
			  
			  r = check(ya,yb,yc,yd, res.roots);

			  if (r)
			  {
			    return r;
			  }
			  
			  return check(0,bb,cc,dd, res.roots);
			}
			*/
		}

		function cutBezier(p, k1, k2) {
			var q = [{
				x: 0,
				y: 0
			}, {
				x: 0,
				y: 0
			}, {
				x: 0,
				y: 0
			}, {
				x: 0,
				y: 0
			}];

			var r = calcBezierPoint(p, k1);
			q[0].x = r.x;
			q[0].y = r.y;

			r = calcBezierPoint(p, k2);
			q[3].x = r.x;
			q[3].y = r.y;

			var s1 = calcBezierPoint(p, (k2 - k1) * 0.25 + k1);
			var s2 = calcBezierPoint(p, (k2 - k1) * 0.5 + k1);

			q[1].x = (32 * s1.x - 12 * s2.x - 12 * q[0].x + q[3].x) / 9;
			q[1].y = (32 * s1.y - 12 * s2.y - 12 * q[0].y + q[3].y) / 9;

			q[2].x = (36 * s2.x - 32 * s1.x + 9 * q[0].x - 4 * q[3].x) / 9;
			q[2].y = (36 * s2.y - 32 * s1.y + 9 * q[0].y - 4 * q[3].y) / 9;

			return q;
		}

		function cutBezierByEndPoints(p, e1, e2) {
			var k1 = calcCoefficientOfBezierPoint(p, e1);
			var k2 = calcCoefficientOfBezierPoint(p, e2);

			return cutBezier(p, k1, k2);
		}


		var getPathPstns = function(path, startLen, endLen, pstnCnt) {
			var step = (endLen - startLen) / pstnCnt;

			var pstns = [];
			for (var i = 0; i < pstnCnt; i++) {
				pstns.push(path.svgPathEle.getPointAtLength(startLen + step * i));
			}

			return pstns;
		};

		var paintPaths = function(painter, pstns, strokeStyle) {
			var ctx = painter.exec("sketchpad");

			ctx.save();

			if (strokeStyle)
				ctx.strokeStyle = strokeStyle;

			if (pstns.length == 0)
				return;

			ctx.beginPath();
			ctx.fillStyle = strokeStyle;
			for (var i = 0; i < pstns.length - 5; i++) {
				ctx.arc(pstns[i].x, pstns[i].y, 3, Math.PI * 2, 0);
			}
			ctx.stroke();

			ctx.closePath();

			ctx.restore();
		};

		var paint = false;

		Switcher.prototype.paint = function(painter) {
			if (this.mpstns == undefined || (this.curBranch == this.b1 && this.b1pstns == undefined) ||
				(this.curBranch == this.b2 && this.b2pstns == undefined)) {
				var jointPoint = this.getJointPoint();

				var endpointm = this.m.getEndpoint();
				var endpointb1 = this.curBranch.getEndpoint();

				var mTotalLength = this.m.svgPathEle.getTotalLength(),
					bTotalLength = this.curBranch.svgPathEle.getTotalLength();

				var mStartLen, mEndLen, bStartLen, bEndLen, m1, m2, b1, b2;
				if (isSamePstn(jointPoint, this.m.svgPathEle.getStartPstn())) {
					mStartLen = 0;
					mEndLen = 42;

					// m1 = this.m.svgPathEle.getPointAtLength(0);
					// m2 = this.m.svgPathEle.getPointAtLength(mEndLen);
				} else {
					mStartLen = this.m.svgPathEle.getTotalLength();
					mEndLen = this.m.svgPathEle.getTotalLength() - 42;

					// m1 = this.m.svgPathEle.getPointAtLength(mEndLen);
					// m2 = this.m.svgPathEle.getPointAtLength(mStartLen);
					//      m1 = mEndLen / mTotalLength;
					//    m2 = mStartLen / mTotalLength;
				}

				if (isSamePstn(jointPoint, this.curBranch.svgPathEle.getStartPstn())) {
					bStartLen = 0;
					bEndLen = 42;

					// b1 = this.curBranch.svgPathEle.getPointAtLength(0);
					// b2 = this.curBranch.svgPathEle.getPointAtLength(bEndLen);
					// b1 = 0;
					// b2 = bEndLen/bTotalLength;
				} else {
					bStartLen = this.curBranch.svgPathEle.getTotalLength();
					bEndLen = this.curBranch.svgPathEle.getTotalLength() - 42;

					//  b1 = this.curBranch.svgPathEle.getPointAtLength(bEndLen);
					// b2 = this.curBranch.svgPathEle.getPointAtLength(bStartLen);

					//  b1 = bEndLen / bTotalLength;
					//  b2 = bStartLen / bTotalLength;
				}

				var mpstns = getPathPstns(this.m, mStartLen, mEndLen, 50);
				var bpstns = getPathPstns(this.curBranch, bStartLen, bEndLen, 50);

				if (this.curBranch == this.b1)
					this.b1pstns = bpstns;
				else
					this.b2pstns = bpstns;

				this.mpstns = mpstns;
			}


			/*
			if (!paint)
			{
			  console.log("M");
			  
			  console.log(this.m.svgPathEle.getPstns());
			  console.log(m1);
			  console.log(m2);

			  console.log("b");
			  console.log(this.curBranch.svgPathEle.getPstns())
			  console.log(b1)
			  console.log(b2);

			  paint = true;
			}
			else
			{
			}
			*/
			// var be1 = cutBezierByEndPoints(this.m.svgPathEle.getPstns(), m1, m2);
			// var be2 = cutBezierByEndPoints(this.curBranch.svgPathEle.getPstns(), b1, b2);
			//  paintBezier(painter, be1, 6, "red");
			//  paintBezier(painter, be2, 6, "red");
			var c = "darkgreen";
			var mpstns = this.mpstns;
			var bpstns = this.curBranch == this.b1 ? this.b1pstns : this.b2pstns;
			paintPaths(painter, this.mpstns, c);
			paintPaths(painter, bpstns, c);

			var arrowWidth = 10,
				arrowHeight = 10;
			paintArrow1(painter, mpstns[mpstns.length - 5], mpstns[mpstns.length - 1], arrowWidth, arrowHeight, c);
			paintArrow1(painter, bpstns[bpstns.length - 5], bpstns[bpstns.length - 1], arrowWidth, arrowHeight, c);
		};

		/*
		Switcher.prototype.paint = function(painter)
		{
		   var jointPoint = this.getJointPoint();
		   
		  var endpointm = this.m.getEndpoint();
		  var endpointb1 = this.curBranch.getEndpoint();
		  

		   var mlen = isSamePstn(jointPoint, this.m.svgPathEle.getStartPstn()) ? 10 : this.m.svgPathEle.getTotalLength() - 10;
		   var b1len = isSamePstn(jointPoint, this.curBranch.svgPathEle.getStartPstn()) ? 10 : this.curBranch.svgPathEle.getTotalLength() -10;
		   
		   
		   var mpoint = this.m.svgPathEle.getPointAtLength(mlen);
		   var b1point = this.curBranch.svgPathEle.getPointAtLength(b1len);

		  var mradian = getRadianByVector(geo.ccpSub(mpoint, jointPoint));
		  paintArrow(painter, jointPoint, mradian, 30, 8, "rgb(255, 0, 0)");

		  var bradian = getRadianByVector(geo.ccpSub(b1point, jointPoint));
		  paintArrow(painter, jointPoint, bradian, 30, 8, "rgb(255, 0, 0)");
		};
		*/


		//通过svgdoc 构造 地图对象 ps
		//helper util

		//返回svgPathEles中使用的所有的点的集合，每个集合存储的是点的坐标，以及该点处连接了哪些svgPathElement
		// [SVGPathElement] . [{pstn:positon, svgPathEles:[SVGPathElement]}]
		var getAllPstnsOfSvgPaths = function(svgPathEles) {
			var pstns = [];

			svgPathEles.forEach(function(svgPathEle) {
				var startPstn = svgPathEle.getStartPstn();
				var endPstn = svgPathEle.getEndPstn();

				var startPstnIdx = pstnsIdxOf(startPstn, pstns);
				if (startPstnIdx == -1) {
					startPstnIdx = pstns.length;
					pstns.push({
						pstn: startPstn,
						svgPathEles: []
					});
				}

				var endPstnIdx = pstnsIdxOf(endPstn, pstns);
				if (endPstnIdx == -1) {
					endPstnIdx = pstns.length;
					pstns.push({
						pstn: endPstn,
						svgPathEles: []
					});
				}

				pstns[startPstnIdx].svgPathEles.push(svgPathEle);
				pstns[endPstnIdx].svgPathEles.push(svgPathEle);
			});
			return pstns;
		};

		var createPs = function(svgDoc) {
			var svgPathEles = getMapPaths(svgDoc);

			//每张网页的Element等对象都不同的，所以这里必须初始化的svg所在的window的SVGPathElement
			initSVGPathElement(svgPathEles[0].constructor.prototype);

			svgPathEles = svgPathEles.map(function(spe) {
				spe.initPathData();
				return spe;
			});

			var pstns = getAllPstnsOfSvgPaths(svgPathEles);

			//first time create all path, but path's next and prev is all null
			var paths = {};
			svgPathEles.forEach(function(svgPathEle) {
				paths[svgPathEle.getId()] = new Path(svgPathEle);
			});

			//sencod time create all switcher
			var switchers = [];
			pstns.filter(function(pstn) {
					return pstn.svgPathEles.length >= 3;
				})
				.forEach(function(switcherJointPstn) {
					var mainRoadSvgPathElement = switcherJointPstn.svgPathEles.filter(function(svgPathEle) {
						return svgPathEle.isMainRoad();
					})[0];
					debug.assert(mainRoadSvgPathElement, "地图数据错误");

					var branches = switcherJointPstn.svgPathEles.filter(function(svgPathEle) {
						return !svgPathEle.isMainRoad();
					});

					debug.assert(branches.length >= 2, "地图数据错误");

					var switcher = new Switcher(paths[branches[0].getId()], paths[branches[1].getId()], paths[mainRoadSvgPathElement.getId()], branches[0].isCurrentBranch() ? paths[branches[0].getId()] : paths[branches[1].getId()]);
					switchers.push(switcher);

					switcherJointPstn.switcher = switcher;
				});

			//third time: fix all path
			var paths = Object.keys(paths)
				.map(function(key) {
					return paths[key]
				})
				.map(function(path) {
					var svgPathEle = path.svgPathEle;
					var startPstn = svgPathEle.getStartPstn();
					var endPstn = svgPathEle.getEndPstn();

					var prevPs, nextPs;

					var pstn = pstns[pstnsIdxOf(startPstn, pstns)];
					if (pstn.switcher)
						prevPs = pstn.switcher;
					else {
						debug.assert(pstn.svgPathEles.length <= 2, "地图数据错误");
						if (pstn.svgPathEles.length == 1) {
							debug.assert(path.svgPathEle == pstn.svgPathEles[0], "地图数据错误");
							prevPs = undefined;
						} else {
							prevPs = pstn.svgPathEles[0] == path.svgPathEle ? paths[pstn.svgPathEles[1].getId()] : paths[pstn.svgPathEles[0].getId()];
						}
					}

					pstn = pstns[pstnsIdxOf(endPstn, pstns)];
					if (pstn.switcher)
						nextPs = pstn.switcher;
					else {
						debug.assert(pstn.svgPathEles.length <= 2, "地图数据错误");
						if (pstn.svgPathEles.length == 1) {
							debug.assert(path.svgPathEle == pstn.svgPathEles[0], "地图数据错误");
							nextPs = undefined;
						} else {
							nextPs = pstn.svgPathEles[0] == path.svgPathEle ? paths[pstn.svgPathEles[1].getId()] : paths[pstn.svgPathEles[0].getId()];
						}
					}

					path.nextPs = nextPs;
					path.prevPs = prevPs;

					return path;
				});

			return paths[0];
		};

		exports.PS = PS;
		exports.Path = Path;
		exports.Switcher = Switcher;
		exports.createPs = createPs;
		exports.getAllPS = getAllPS;

	}
};