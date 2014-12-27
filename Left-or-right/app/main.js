var Main = function() {
	this.$id = "main";
	this.$colorBox = null;
	this.levels = [];
	this.curLevel = 0;
	this.svgDocs;
	this.$level1 = null;
	this.$openlevel = null;
}

Main.prototype.main = function() {
	var h = this.$colorBox.helper;
	var p = this.$colorBox.painter;
	var d = this.$colorBox.director;
	var openLevel = this.$openlevel;

	var skch = h.createSketchpad(640, 480);
	//  skch.style.float = "left";

	var gpainter = p.HonestPainter.create(skch);
	var gdirector = d.director({
		painter: gpainter
	});

	/*
	var svgDoc1 = document.getElementById("level1").contentDocument;
	var svgDoc2 = document.getElementById("level2").contentDocument;

	document.getElementById("level1").parentNode.removeChild(document.getElementById("level1"));
	document.getElementById("level2").parentNode.removeChild(document.getElementById("level2"));

	var glevel = Level1.create({svgDoc:svgDoc1});
	var gscene = glevel.exec("scene");


	gdirector.exec("setLevel", glevel); 
	 // glevel.exec("start");

	levels.push(glevel);
	levels.push(Level1.create({svgDoc:svgDoc2}));

	*/
	this.getMapDatas();

	var ol = openLevel.OpenLevel().create();
	gdirector.exec("setLevel", ol);
	//runNextLevel();

	var lastTime = Date.now();
	var gclock = 0;
	var dt = 0;

	var times = 0;
	var elapsed = 0;

	function loop() {
		var now = Date.now();
		// 这次循环和上次循环的间隔时间，以毫秒为单位
		var dt = now - lastTime;
		//var dt = 30;
		// 游戏世界的绝对时间，以毫秒为单位

		elapsed += dt;
		times++;

		if (elapsed > 2000) {
			//      document.getElementById("fps").innerHTML = Math.floor(times * 1000 / elapsed) + "";

			elapsed = 0;
			times = 0;
		}

		gclock += dt;
		// 游戏的主更新函数
		gdirector.exec("update", gclock);
		lastTime = now;
	}

	// 确保第一次调用游戏的主更新函数时传递的值是0,0
	gdirector.exec("update", gclock);

	// 以50帧每秒(即每隔20毫秒)的帧率来驱动loop函数
	setInterval(loop, 30);
}

Main.prototype.isLastLevel = function() {
	return this.curLevel == (this.levels.length - 1);
}

Main.prototype.runNextLevel = function() {
	var d = this.$colorBox.director;
	document.getElementById("des").style.visibility = "visible";

	var director = d.director();

	if (this.levels.length == 0 || this.isLastLevel()) {
		this.createAllLevels();
		this.curLevel = 0;
	} else
		this.curLevel += 1;

	if (this.levels.length == 0)
		return;

	var levelTrans = this.$colorBox.leveltransition;

	var leaveFun = levelTrans.leaveLevelTransGenerator(director, "left2right");
	var enterFun = levelTrans.enterLevelTransGenerator(director, "left2right");
	var transInfo = levelTrans.SetLevelSequenceTransition.create({
		enterTrans: enterFun,
		leaveTime: 1,
		enterTime: 1000
	});
	director.exec("setLevel", this.levels[this.curLevel], transInfo);
}

Main.prototype.runCurLevelAgain = function() {
	var d = this.$colorBox.director;
	var director = d.director();

	var level1 = this.$level1;

	this.levels[this.curLevel] = level1.Level1().create({
		svgDoc: this.svgDocs[this.curLevel]
	});

	var levelTrans = this.$colorBox.leveltransition;

	var leaveFun = levelTrans.leaveLevelTransGenerator(director, "left2right");
	var enterFun = levelTrans.enterLevelTransGenerator(director, "left2right");
	var transInfo = levelTrans.SetLevelSequenceTransition.create({
		enterTrans: enterFun,
		leaveTime: 1,
		enterTime: 1000
	});
	director.exec("setLevel", this.levels[this.curLevel], transInfo);
}

Main.prototype.nodelist2Array = function(nl) {
	var ret = [];

	for (var i = 0; i < nl.length; i++) {
		ret.push(nl[i]);
	}

	return ret;
};

Main.prototype.getMapDatas = function() {
	if (!this.svgDocs) {
		var objects = this.nodelist2Array(document.getElementsByTagName("svg"));
		this.svgDocs = objects.map(function(object) {
			//return object.contentDocument;
			return object;
		});

		//remove all objects from page
		objects.forEach(function(object) {
			object.parentNode.removeChild(object);
		});
		document.getElementById("br").parentNode.removeChild(document.getElementById("br"));
	}
};

Main.prototype.createAllLevels = function() {
	var level1 = this.$level1;
	this.levels = this.svgDocs.map(function(svgDoc) {
		return level1.Level1().create({
			svgDoc: svgDoc
		});
	});

	return this.levels;
};

bearcat.module(Main, typeof module !== 'undefined' ? module : {});