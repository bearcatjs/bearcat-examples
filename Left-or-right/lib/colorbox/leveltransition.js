__resources__["/__builtin__/leveltransition.js"] = {
  meta: {
    mimetype: "application/javascript"
  },
  data: function(exports, require, module, __filename, __dirname) {
    var director = require("director"),
      debug = require("debug"),
      animate = require("animate"),
      makeAnimationsByTime = require("animate").makeAnimationsByTime,
      SequenceAnimation = require("animate").SequenceAnimation,
      ngeometry = require("geometry");

    var Klass = require("base").Klass,
      Trait = require("oo").Trait;


    //[time, pos, 'linear'] ...
    var fadeToByTime = function() {
      return SequenceAnimation.create({
        animations: makeAnimationsByTime(function(val, target) {
            target.exec("set", "alpha", val);
          },
          Array.prototype.slice.call(arguments, 0))
      });
    }

    var moveToByTime = function() {
      return SequenceAnimation.create({
        animations: makeAnimationsByTime(function(val, target) {
            target.tx = val.x;
            target.ty = val.y;
          },
          Array.prototype.slice.call(arguments, 0))
      });
    }

    var scaleToXYByTime = function() {
      return SequenceAnimation.create({
        animations: makeAnimationsByTime(function(val, target) {
            ngeometry.matrixScaleBy(target, val.x, val.y)
          },
          Array.prototype.slice.call(arguments, 0))
      });
    }

    var rotateToByTime = function() {
      return SequenceAnimation.create({
        animations: makeAnimationsByTime(function(val, target) {
            ngeometry.matrixRotateBy(target, val);
          },
          Array.prototype.slice.call(arguments, 0))
      });
    }



    var leaveLevelTransAnis = {
      "left2right": function(w, h) {
        var ma = moveToByTime(
          [0, {
            x: 0,
            y: 0
          }, 'linear'], [1, {
            x: w,
            y: 0
          }, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },

      "right2left": function(w, h) {
        var ma = moveToByTime(
          [0, {
            x: 0,
            y: 0
          }, 'linear'], [1, {
            x: -w,
            y: 0
          }, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },

      "top2bottom": function(w, h) {
        var ma = moveToByTime(
          [0, {
            x: 0,
            y: 0
          }, 'linear'], [1, {
            x: 0,
            y: h
          }, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },

      "bottom2top": function(w, h) {
        var ma = moveToByTime(
          [0, {
            x: 0,
            y: 0
          }, 'linear'], [1, {
            x: 0,
            y: -h
          }, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },

      "zoomOut": function(w, h) {
        var ma1 = moveToByTime(
          [0, {
            x: 0,
            y: 0
          }, 'linear'], [1, {
            x: w,
            y: h
          }, 'linear']
        );

        var ma2 = scaleToXYByTime(
          [0, {
            x: 1,
            y: 1
          }, 'sine'], [1, {
            x: 0.1,
            y: 0.1
          }, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma1, ma2]
        });
      },

      "zoomInRotate180": function(w, h) {
        var ma1 = moveToByTime(
          [0, {
            x: 0,
            y: 0
          }, 'linear'], [1, {
            x: w,
            y: h
          }, 'linear']
        );

        var ma2 = scaleToXYByTime(
          [0, {
            x: 1,
            y: 1
          }, 'sine'], [2 / 3, {
            x: 0.3,
            y: 0.3
          }, 'linear'], [1, {
            x: 1,
            y: 1
          }, 'linear']
        );

        var ma3 = rotateToByTime(
          [0, 0, 'linear'], [1, Math.PI * 2, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma1, ma2, ma3]
        });
      },

      "fadeOut": function() {
        var ma = fadeToByTime(
          [0, 1, 'linear'], [1, 0, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },
    };

    var enterLevelTransAnis = {
      "left2right": function(w, h) {
        var ma = moveToByTime(
          [0, {
            x: w,
            y: 0
          }, 'linear'], [1, {
            x: 0,
            y: 0
          }, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },

      "right2left": function(w, h) {
        var ma = moveToByTime(
          [0, {
            x: -w,
            y: 0
          }, 'linear'], [1, {
            x: 0,
            y: 0
          }, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },

      "top2bottom": function(w, h) {
        var ma = moveToByTime(
          [0, {
            x: 0,
            y: -h
          }, 'linear'], [1, {
            x: 0,
            y: 0
          }, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },

      "bottom2top": function(w, h) {
        var ma = moveToByTime(
          [0, {
            x: 0,
            y: h
          }, 'linear'], [1, {
            x: 0,
            y: 0
          }, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },

      "zoomIn": function(w, h) {
        var ma1 = moveToByTime(
          [0, {
            x: w,
            y: h
          }, 'linear'], [1, {
            x: 0,
            y: 0
          }, 'linear']
        );

        var ma2 = scaleToXYByTime(
          [0, {
            x: 0.1,
            y: 0.1
          }, 'sine'], [1, {
            x: 1,
            y: 1
          }, 'linear']);

        return animate.ParallelAnimation.create({
          animations: [ma1, ma2]
        });
      },

      "zoomInRotate360": function(w, h) {
        var ma1 = moveToByTime(
          [0, {
            x: w,
            y: h
          }, 'linear'], [1, {
            x: 0,
            y: 0
          }, 'linear']
        );

        var ma2 = scaleToXYByTime(
          [0, {
            x: 0.1,
            y: 0.1
          }, 'sine'], [0.5, {
            x: 0.7,
            y: 0.7
          }, 'sine'], [1, {
            x: 1,
            y: 1
          }, 'sine']);


        var ma3 = rotateToByTime(
          [0, 0, 'linear'], [1, Math.PI * 2, 'linear']);


        return animate.ParallelAnimation.create({
          animations: [ma1, ma2, ma3]
        });
      },

      "fadeIn": function() {
        var ma = fadeToByTime(
          [0, 0, 'linear'], [1, 1, 'linear']
        );

        return animate.ParallelAnimation.create({
          animations: [ma]
        });
      },
    };

    function transGenerator(ani) {
      ani.exec("prepare");
      return function(imgModel, t) {
        var displayList = [];
        var mat = ngeometry.identityMatrix();

        if (imgModel) {
          ani.exec("update", t, mat);
          displayList.push([mat, imgModel]);
        }

        return displayList;
      }
    }

    function leaveLevelTransGenerator(director, leaveTranStr) {
      var transani = leaveLevelTransAnis[leaveTranStr](director.exec("defaultPainterWidth"), director.exec("defaultPainterHeight"));

      return transGenerator(transani);
    }

    function enterLevelTransGenerator(director, enterTranStr) {
      var transani = enterLevelTransAnis[enterTranStr](director.exec("defaultPainterWidth"), director.exec("defaultPainterHeight"));

      return transGenerator(transani);
    }

    function levelFadeFun(ani) {
      return function(imgModel, t) {
        var displayList = [];
        var mat = ngeometry.identityMatrix();

        if (imgModel) {
          ani.exec("update", t, imgModel);
          displayList.push([mat, imgModel]);
        }

        return displayList;
      }

    }

    function leaveLevelFadeOutGenerator() {
      var ani = leaveLevelTransAnis["fadeOut"]();
      ani.exec("prepare");

      return levelFadeFun(ani);
    }

    function enterLevelFadeInGenerator() {
      var ani = enterLevelTransAnis["fadeIn"]();
      ani.exec("prepare");

      return levelFadeFun(ani);
    }

    var setLevelTransitionBaseTrait = Trait.extend({
      initialize: function() {
        this.execProto("initialize");

        return this;
      },

      trans: function() {
        debug.assert(false, "SetLevelTransitionBase-->trans can not exec");
      },

      isDone: function() {
        debug.assert(false, "SetLevelTransitionBase-->isDone can not exec");
      },
    });

    var SetLevelTransitionBase = Klass.extend([setLevelTransitionBaseTrait]);

    var setLevelParallelTransitionTrait = Trait.extend({
      initialize: function(param) {
        this.execProto("initialize");

        this.slot("_leaveTime", param.leaveTime);
        this.slot("_enterTime", param.enterTime);
        this.slot("_leaveTrans", param.leaveTrans);
        this.slot("_enterTrans", param.enterTrans);
        this.slot("_elapsed", 0);

        return this;
      },

      trans: function(leaveImgModel, enterImgModel, t) {
        var percent, displayList = [];

        if (this.slot("_startTime") === undefined)
          this.slot("_startTime", t);

        this.slot("_elapsed", t - this.slot("_startTime"));

        percent = (t - this.slot("_startTime")) / this.slot("_leaveTime");
        if (this.slot("_leaveTrans"))
          displayList = this.slot("_leaveTrans")(leaveImgModel, percent);
        percent = (t - this.slot("_startTime")) / this.slot("_enterTime");
        if (this.slot("_enterTrans"))
          displayList = displayList.concat(this.slot("_enterTrans")(enterImgModel, percent));

        return displayList;
      },

      isDone: function() {
        var totalTime = this.slot("_leaveTime") > this.slot("_enterTime") ? this.slot("_leaveTime") : this.slot("_enterTime")
        return this.slot("_elapsed") >= totalTime;
      },
    });

    var SetLevelParallelTransition = SetLevelTransitionBase.extend([setLevelParallelTransitionTrait]);

    var setLevelSequenceTransitionTrait = Trait.extend({
      initialize: function(param) {
        this.execProto("initialize");

        //if(param.leaveTime)
        this.slot("_leaveTime", param.leaveTime);
        this.slot("_enterTime", param.enterTime);
        this.slot("_leaveTrans", param.leaveTrans);
        this.slot("_enterTrans", param.enterTrans);
        this.slot("_elapsed", 0);

        return this;
      },

      trans: function(leaveImgModel, enterImgModel, t) {
        var percent, displayList = [];


        if (this.slot("_startTime") === undefined)
          this.slot("_startTime", t);

        this.slot("_elapsed", t - this.slot("_startTime"));

        percent = (t - this.slot("_startTime")) / this.slot("_leaveTime");
        if (this.slot("_elapsed") <= this.slot("_leaveTime") && this.slot("_leaveTrans"))
          displayList = this.slot("_leaveTrans")(leaveImgModel, percent);
        else {
          percent = (t - this.slot("_startTime") - this.slot("_leaveTime")) / this.slot("_enterTime");
          if ((this.slot("_elapsed") - this.slot("_leaveTime")) <= this.slot("_enterTime") && this.slot("_enterTrans"))
            displayList = this.slot("_enterTrans")(enterImgModel, percent);
        }

        return displayList;
      },

      isDone: function() {
        var totalTime = this.slot("_leaveTime") + this.slot("_enterTime");
        return this.slot("_elapsed") >= totalTime;
      },
    });

    var SetLevelSequenceTransition = SetLevelTransitionBase.extend([setLevelSequenceTransitionTrait]);



    exports.leaveLevelTransGenerator = leaveLevelTransGenerator;
    exports.enterLevelTransGenerator = enterLevelTransGenerator;
    exports.leaveLevelFadeOutGenerator = leaveLevelFadeOutGenerator;
    exports.enterLevelFadeInGenerator = enterLevelFadeInGenerator;
    exports.SetLevelParallelTransition = SetLevelParallelTransition;
    exports.SetLevelSequenceTransition = SetLevelSequenceTransition;

  }
};