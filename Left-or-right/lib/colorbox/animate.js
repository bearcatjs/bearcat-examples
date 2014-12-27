
__resources__["/__builtin__/animate.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var util = require("util")
, debug = require("debug")
, Klass = require("base").Klass
, BObject = require("base").BObject

var tweenFunctions = 
  {
    linear :                         function(v) { return v },

    set :                            function(v) { return Math.floor(v) },

    discrete :                       function(v) { return Math.floor(v) },

    sine :                           function(v) { return 0.5-0.5*Math.cos(v*Math.PI) },

    sproing :                        function(v) { return (0.5-0.5*Math.cos(v*3.59261946538606)) * 1.05263157894737},

    square :                         function(v) { return v*v},

    cube :                           function(v) { return v*v*v},

    sqrt :                           function(v) { return Math.sqrt(v)},

    curt :                           function(v) { return Math.pow(v, -0.333333333333)}
  };

/*-------------------------------------------------------------------------------------------
new timeline implement--> support easily combination
-------------------------------------------------------------------------------------------*/

var linear = tweenFunctions['linear'];
var set = tweenFunctions['set'];
var discrete = tweenFunctions['discrete'];
var sine = tweenFunctions['sine'];
var sproing = tweenFunctions['sproing'];
var square = tweenFunctions['square'];
var cube = tweenFunctions['cube'];
var sqrt = tweenFunctions['sqrt'];
var curt = tweenFunctions['curt'];

var lift = function(f)
{
  return function(tl)
  {
    return function(p)
    {
      return f(tl(p));
    };
  };
};

var consttl = function(v)
{
  return function(p)
  {
    return v;
  };
};

var slerptl = function(v1, v2, tl)
{
  var t1 = consttl(v1);
  var t2 = consttl(v2);
  var t3 = tl;

  // t1(p) + (t2(p) - t1(p)) * t3(p)
  return addtl(t1, multl(t3, subtl(t2, t1)));
};

var maptl = function(op, tl)
{
  return function(p)
  {
    return op(tl(p));
  };
};

var reversetl = function(tl, totalTime)
{
  return function(t)
  {
    return tl(totalTime-t);
  };
};

//if you do not want give me
var foldltl = function(op, tls, v)
{
  return function(p)
  {
    var v1, t, i;

    for (i=0, v1=v; i<tls.length; i++)
    {
      t = tls[i](p);

      v1 = op(v1, t);
    }

    return v1;
  }
};

var addtl;
var subtl;
var multl;

(function()
 {
   var createoptable = function(primitiveop)
   {
     var objectobject = function(v1, v2)
     {
       var ret = typeof(v1) == "object" ? {} : [];

       debug.assert(typeof(v1) == typeof(v2), "logical error");

       util.each(v1, function(val, key)
                 {
                   if (typeof(val) == "object" || typeof(val) == "array")
                     ret[key] = objectobject(val, v2[key]);
                   else
                     ret[key] = primitiveop(val, v2[key]);
                 });

       return ret;
     };

     var objectnumber = function(v1, v2)
     {
       var ret = typeof(v1) == "object" ? {} : [];

       util.each(v1, function(val, key)
                 {
                   if (typeof(val) == "object" || typeof(val) == "array")
                     ret[key] = objectnumber(val, v2);
                   else
                     ret[key] = primitiveop(val, v2);
                 });

       return ret;
     };

     var numberobject = function(v1, v2)
     {
       return objectnumber(v2, v1);
     };
     
     var numbernumber = function(v1, v2)
     {
       return primitiveop(v1, v2);
     }

     return {
       objectobject:objectobject,
       arrayarray:objectobject,
       objectarray:objectobject,
       arrayobject:objectobject,
       objectnumber:objectnumber,
       arraynumber:objectnumber,
       numberobject:numberobject,
       numberarray:numberobject,
       numbernumber:numbernumber,
     };
   };

   var createop = function(table)
   {
     return function(v1, v2)
     {   
       if (v1 == undefined || v2 == undefined)
         return v1 || v2;

       var optype = typeof(v1) + typeof(v2);
       if (!table[optype])
       {
         debug.error("I donot known how to opeate the two value");
         return undefined;
       }
       
       return table[typeof(v1) + typeof(v2)](v1, v2);
     };
   };
  
   var addop = createop(createoptable(function(v1, v2){return v1 + v2;}));
   var mulop = createop(createoptable(function(v1, v2){return v1 * v2;}));
   var subop = createop(createoptable(function(v1, v2){return v1 - v2;}));
   var divop = createop(createoptable(function(v1, v2){return v1/v2;}));

   var createFoldtlCombinator = function(op)
   {
     return function()
     {
       if (arguments.length == 1)
         return arguments[0];

       var args = [];
       for (var i = 0; i<arguments.length; i++)
       {
         args.push(arguments[i]);
       }

       return foldltl(op, args, undefined);
     };
   };

   addtl = createFoldtlCombinator(addop);
   subtl = createFoldtlCombinator(subop);
   multl = createFoldtlCombinator(mulop);
 }());

var startTimetl = function(startTime, tl)
{
  return function(t)
  {
    return tl(t-startTime);
  }
}

var percentTl = function(startTime, endTime, tl)
{
  return function(t)
  {
    return tl((t-startTime)/(endTime-startTime));
  }
}

//animation

var AnimationBase = Klass.extend(
  undefined,
  {
    initialize:function(param)
    {
      //AnimationBase.superClass.init.call(this);
      this.execProto("initialize", param);

      this.slot("_isPaused", false);
      
      this.slot("_state", "prepare");
      this.slot("_startTime", -1);
      this.slot("_curTime", -1);
    },
    
    prepare:function(target)
    {
      this.slot("_state", "prepare");
      this.slot("_startTime", -1);
      this.slot("_curTime", -1);
      
      this.exec("doPrepare", target);
    },

    doPrepare:function()
    {
      
    },

    target:function()
    {
      return undefined;
    },
    
    isDone:function()
    {
      return (this.slot("_curTime") - this.slot("_startTime")) >= this.exec("totalTime");
    },
    
    curTime:function()
    {
      return this.slot("_curTime");
    },

    startTime:function()
    {
      return this.slot("_startTime");
    },

    update: function (t, target)
    {
      if (this.exec("isPaused") || this.exec("isDone"))
        return;

      if (this.slot("_state") == "prepare")
      {
        this.slot("_startTime", t);
        this.slot("_state",  "running");
      }
      
      var tg = this.exec("target");
      tg = tg ? tg : target;

      if (this.slot("onFrameBegin"))
        this.slot("onFrameBegin")(t-this.slot("_startTime"));

      this.exec("doUpdate", t-this.slot("_startTime"), target);

      if (this.slot("onFrameEnd"))
        this.slot("onFrameEnd")(t-this.slot("_startTime"));

      var prevTime = this.slot("_curTime");
      this.slot("_curTime", t);

      if (this.exec("hasCBs"))
        this.exec("cb", t-this.slot("_startTime"), prevTime-this.slot("_startTime"));
    },

    regCBsByPercent:function(cbs)
    {
      var totalTime = this.exec("totalTime");

      return this.exec("regCBsByTime", cbs.map(function(cb)
                                       {
                                         return {time:cb.time * totalTime, cb:cb.cb};
                                       }));
    },

    regCBsByTime:function(cbs)
    {
      if (!this.slot("_cbs"))
        this.slot("_cbs", []);

      this.slot("_cbs", this.slot("_cbs").concat(cbs));

      this.slot("_cbs").sort(function(cb1, cb2)
                             {
                               return cb1.time - cb2.time;
                             });    
    },

    regCBByPercent:function(time, cb)
    {
      return this.exec("regCBByTime", time * this.exec("totalTime"), cb);
    },

    regCBByTime:function(time, cb)
    {
      if (!this.slot("_cbs"))
        this.slot("_cbs", []);
      
      this.slot("_cbs").push({time:time, cb:cb});

      this.slot("_cbs").sort(function(cb1, cb2)
                             {
                               return cb1.time - cb2.time;
                             });
    },

    cancelCBByTime:function(time, cb)
    {
      this.slot("_cbs", this.slot("_cbs").filter(function(item)
                                                 {
                                                   if (item.time == time && (cb == undefined || cb == item.cb))
                                                     return false;
                                                   
                                                   return true;
                                                 }));

      if (this.slot("_cbs").length == 0)
      {
        this.rmSlot("_cbs");
      }
    },

    cancelCBByPercent:function(time, cb)
    {
      return this.exec("cancelCBByTime", time*this.exec("totalTime"), cb);
    },

    cancelAllCBs:function()
    {
      this.rmSlot("_cbs");
    },

    hasCBs:function()
    {
      return this.slot("_cbs") != undefined;
    },

    //call all cbs between (lastTime, time] or [time lastTime)
    cb:function(time, lastTime)
    {
      if (!this.slot("_cbs") || lastTime == time)
        return;

      var dirToRight = time > lastTime;

      var cbs = [];
      this.slot("_cbs").forEach(function(cb1)
                                {
                                  if ((dirToRight && (lastTime < cb1.time && cb1.time <= time)) ||
                                      (!dirToRight && (time <= cb1.time && cb1.time < lastTime)))
                                    cbs.push(cb1);
                                });

      if (!dirToRight)
        cbs = cbs.reverse();

      cbs.forEach(function(cb1)
                  {
                    cb1.cb(dirToRight);
                  });
    },

    doUpdate:function(t, target)
    {
      debug.assert(false, "Animation base-->should not in");
    },
    
    copy:function()
    {
      debug.assert(false, "Animation base-->should not in");
    },
    
    reverse:function()
    {
      debug.assert(false, "Animation base-->should not in");
    },

    pause:function()
    {    
      if (this.slot("_isPaused") == true)
      {
        debug.warning("pause paused animation");
      }
      
      this.slot("_isPaused", true);
    },

    resume:function()
    {
      if (this.slot("_isPaused") ==  false)
      {
        debug.warning("resume a unpaused animation");
      }

      this.slot("_isPaused", false);
    },

    isPaused:function()
    {
      return this.slot("_isPaused") == true;
    },
  }
);

var Animation = AnimationBase.extend(
  undefined,
  {
    initialize: function(params)
    {
      this.execProto("initialize", params);
      
      this.slot("_variable", params.variable);
      this.slot("_timeline", params.timeline);
      this.slot("_totalTime", params.totalTime);

      debug.assert(this.slot("_variable") && this.slot("_timeline") && typeof(this.slot("_totalTime")) == 'number', "Animation parameters error");

      this.slot("_target", params.target);
    },
    
    doPrepare: function()
    {
    },

    totalTime:function()
    {
      return this.slot("_totalTime");
    },
    
    _setTargetVal: function(variable, val, target)
    {
      if (typeof(variable) == 'string')
      {
        //target[variable] = val;
        target.slot(variable, val);
      }
      else if (typeof(variable) == 'function')
      {
        variable(val, target);
      }
      else if (typeof(variable) == 'array')
      {
        variable.forEach(function(item, i, array)
                         {
                           this.exec("_setTargetVal", item, val, target);
                         }, 
                         this);
      }
    },

    doUpdate: function(t, target)
    {
      var val = this.slot("_timeline")(t);
      
      debug.assert(this.slot("_target") || target, "Animation, there is no target!");
      this.exec("_setTargetVal", this.slot("_variable"), val, this.slot("_target") ? this.slot("_target") : target);
    },
    
    copy:function()
    {
      var newOne = Animation.create({variable:this.slot("_variable"), timeline:this.slot("_timeline"), totalTime:this.slot("_totalTime"), target:this.slot("_target")});
      return newOne;
    },
    
    reverse:function()
    {
      var newOne = Animation.create({variable:this.slot("_variable"), timeline:reversetl(this.slot("_timeline"), this.slot("_totalTime")), totalTime:this.slot("_totalTime"), target:this.slot("_target")});
      return newOne;
    },
    
    setTarget:function(target)
    {
      this.slot("_target", target);
    },

    target: function ()
    {
      return this.slot("_target");
    },

    variable:function()
    {
      return this.slot("_variable");
    },

    value:function(time)
    {
      var value = {variable:this.slot("_variable")};
      
      time = time > this.slot("_totalTime") ? this.slot("_totalTime") : time;

      value.value = this.slot("_timeline")(time);

      return [value];
    },

  }
);

var SequenceAnimation = AnimationBase.extend(
  undefined,
  {
    initialize: function(params)
    {
      this.execProto("initialize", params);
      
      debug.assert(params.animations, 'SequenceAnimation constructor param error');

      this.slot("_animations", params.animations);
      
      this.slot("_curanimation", null);
      
      if (typeof(params.interval) == "number")
        this.slot("_interval", params.interval);
      else
        this.slot("_interval", 0);

      var prevTime = 0;
      var interval = this.slot("_interval");
      this.slot("_animations", this.slot("_animations").map(function(ani, i)
                                                           {
                                                             var a = {ani:ani, startTime:prevTime + i * interval};
                                                             prevTime += ani.exec("totalTime");
                                                             
                                                             return a;
                                                           }));

      this.slot("_curAniIdx", -1);
    },
    
    doPrepare: function()
    {
      if (0 == this.slot("_animations").length)
      {
        return;
      }

      this.slot("_curAniIdx", -1);
    },
    
    doUpdate: function(t, target)
    {
      var curAniIdx = this.slot("_curAniIdx");
      var anis = this.slot("_animations");

      //check if need select animation
      if (curAniIdx != -1 &&
          anis[curAniIdx].startTime <= t && 
          (curAniIdx == anis.length - 1 ||
           t < anis[curAniIdx+1].startTime))
      {
        //just update it
        anis[curAniIdx].ani.exec("update", t, target);
      }
      else
      {
        var idx = -1;
        anis.some(function(a, i, arr)
                  {
                    if (i == arr.length -1)
                    {
                      idx = i;
                      return true;
                    }

                    if (a.startTime <= t && t <= arr[i+1].startTime)
                    {
                      idx = i;
                      return true;
                    }

                    return false;
                  });

        debug.assert(idx != -1, "logical error");
        
        this.slot("_curAniIdx", idx);

        var selectedAni = anis[idx].ani;

        //reset animation
        selectedAni.exec("prepare");
        //set startTime
        selectedAni.exec("update", anis[idx].startTime, target);

        if (t != anis[idx].startTime)
          selectedAni.exec("update", t, target);
      }
    },
    
    copy:function()
    {
      var animations = this.slot("_animations").map(function(item)
                                            {
                                              return item.ani.exec("copy");
                                            });
      return SequenceAnimation.create({animations:animations});
    },
    
    reverse:function()
    {
      var animations = this.slot("_animations").map(function(item)
                                            {
                                              return item.ani.exec("reverse");
                                            });
      return SequenceAnimation.create({animations:animations.reverse()});
    },

    totalTime:function()
    {
      var totalTime = 0
      ,   interval  = this.slot("_interval");

      this.slot("_animations").forEach(function(animation, i)
                               {
                                 totalTime += animation.ani.exec("totalTime") + interval;
                               });

      totalTime -= interval;

      return totalTime;
    },

    value:function(time)
    {
      var animation;
      var totalTime = this.exec("totalTime");
      var interval = this.slot("_interval");

      time = time > totalTime ? totalTime : time;
      
      this.slot("_animations").some(function(a, i)
                                    {
                                      var totalTime = a.ani.exec("totalTime");
                                      if (time > (totalTime + interval))
                                      {
                                        time -= totalTime + interval;
                                        return false;
                                      }
                                      else
                                      {
                                        animation = a.ani;
                                        return true;
                                      }
                                    });

      debug.assert(animation, "canont find animation");
      return animation.exec("value", time);
    },
  });

var TimesAnimation = AnimationBase.extend(
  undefined,
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);
      
      this.slot("_times", param.times);
      this.slot("_animation", param.animation);

      if (typeof(param.interval) == "number")
        this.slot("_interval", param.interval);
      else
        this.slot("_interval", 0);
    },
    
    doPrepare:function()
    {
      this.slot("_animation").exec("prepare");
      this.slot("_elapsedTimes", 1);
    },
    
    doUpdate: function(t, target)
    {
      var self = this;

      var doUpdate = function(ani, t)
      {
        ani.exec("update", t, target);
        
        //last animation donot have interval
        if ((self.slot("_elapsedTimes") + 1 == self.slot("_times") &&
             t > (ani.exec("startTime") + ani.exec("totalTime"))) 
            ||
            (t > (ani.exec("startTime") + ani.exec("totalTime") + self.slot("_interval")) && 
             self.slot("_elapsedTimes") < self.slot("_times")))
        {
          self.slot("_elapsedTimes", self.slot("_elapsedTimes")+1);
          
          //set start time
          var startTime = ani.exec("startTime") + ani.exec("totalTime") + self.slot("_interval");

          ani.exec("prepare");

          ani.exec("update", startTime, target);
          
          if (startTime < t)
            doUpdate(ani, t);
        }
      }

      doUpdate(this.slot("_animation"), t);
    },
    
    copy:function()
    {
      return TimesAnimation.create({animation:this.slot("_animation").exec("copy"), times:this.slot("_times")});
    },
    
    reverse:function()
    {
      return TimesAnimation.create({animation:this.slot("_animation").exec("reverse"), times:this.slot("_times")});
    },

    totalTime:function()
    {
      if (this.slot("_times") == 0)
        return 0;

      return this.slot("_animation").exec("totalTime") * this.slot("_times") + (this.slot("_times") - 1) * this.slot("_interval");
    },

    value:function(time)
    {
      var totalTime = this.exec("totalTime");

      time = time > totalTime ? totalTime : time;
      
      time = time % (this.slot("_animation").exec("totalTime") + this.slot("_interval"));

      return this.slot("_animation").exec("value", time);
    },
  });

var ParallelAnimation = AnimationBase.extend(
  undefined,
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);
      
      if (param.animations)
        this.slot("_animations", param.animations);
      else
        this.slot("_animations", []);
    },
    
    doPrepare:function()
    {
      this.slot("_animations").forEach(function(animation)
                               {
                                 animation.exec("prepare");
                               });
    },
    
    isDone:function()
    {
      return this.slot("_animations").every(function(animation)
                                    {
                                      return animation.exec("isDone");
                                    });
    },
    
    doUpdate: function(t, target)
    {
      this.slot("_animations").forEach(function(animation)
                               {
                                 animation.exec("update", t, target);
                               });
    },
    
    copy:function()
    {
      var animations = this.slot("_animations").map(function(animation)
                                            {
                                              return animation.exec("copy");
                                            });
      return ParallelAnimation.create({animations:animations});
    },
    
    reverse:function()
    {
      var animations = this.slot("_animations").map(function(animation)
                                            {
                                              return animation.exec("reverse");
                                            });
      return ParallelAnimation.create({animations:animations.reverse()});
    },

    totalTime:function()
    {
      var totalTime = 0;
      this.slot("_animations").forEach(function(animation, i)
                               {
                                 var t = animation.exec("totalTime");
                                 totalTime = totalTime > t ? totalTime : t;
                               });
      return totalTime;
    },

    value:function(time)
    {
      return this.slot("_animations").map(function(animation, i)
                                          {
                                            return animation.exec("value", time);
                                          });
    },
  });

//helper util
var gen_movetl = function(speed)
{
  return function(t)
  {
    return t*speed;
  }
}

var moveX = function(pos, speed)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.exec("setX", val);
                           },
                           
                           timeline:function(t)
                           {
                             return t * speed;
                           },

                           totalTime:Infinity});
};

var moveY = function(pos, speed)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.exec("setY", val);
                           },
                           timeline:function(t)
                           {
                             return t * speed;
                           },
                           totalTime:Infinity});
};

var moveXY = function(pos, xSpeed, ySpeed)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.exec("translate", val.x, val.y);
                           },
                           timeline:function(t)
                           {
                             return {x:xSpeed*t, y:ySpeed*t};
                           },
                           totalTime:Infinity});
};

var moveToX = function(x1, x2, totalTime)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.exec("setX", val);
                           },
                           timeline:function(t)
                           {
                             var percent = t / totalTime;
                             return x1 + (x2 - x1) * percent;
                           },
                           totalTime:totalTime});
}

var moveToY = function(y1, y2, totalTime)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.exec("setY", val);
                           },
                           timeline:function(t)
                           {
                             var percent = t / totalTime;
                             return y1 + (y2 - y1) * percent;
                           },
                           totalTime:totalTime});
}

function makeAnimationsByTime(variable, args)
{
  var anis = []

  args.forEach(function(arg, i)
               {
                 // [0 args.length-2]
                 if (i == args.length-1)
                   return;

                 var totalTime = args[i+1][0] - args[i][0]
                 ,   timeline;

                 if (typeof(arg[2]) == "string")
                   timeline = slerptl(args[i][1], args[i+1][1], percentTl(0, totalTime, tweenFunctions[arg[2]]));
                 else
                   timeline = arg[2];
                 
                 anis.push(Animation.create({variable:variable, timeline:timeline, totalTime:totalTime}));
               });

  return anis;
}

//[time, pos, 'linear'] ...
var moveToByTime = function()
{
  return SequenceAnimation.create({animations:makeAnimationsByTime(function(val, target)
                                                                   {
                                                                     target.exec("translate", val.x, val.y);
                                                                   }, 
                                                                   Array.prototype.slice.call(arguments, 0))});
}

//[pos, speed] [pos1, speed1] [pos2, speed2] ... [pos3]
var moveToBySpeed = function()
{
  var args = Array.prototype.slice.call(arguments, 0)
  ,   time = 0;

  args = args.map(function(item, i, arr)
                  {
                    if (i == 0)
                    {
                      return [time, item[0], 'linear'];
                    }

                    //update time
                    var pos0 = arr[i-1][0]
                    ,   pos1 = arr[i][0]
                    ,   xdis = pos1.x - pos0.x
                    ,   ydis = pos1.y - pos0.y;

                    time += Math.abs(Math.sqrt(xdis*xdis + ydis*ydis) / arr[i-1][1]);
                    
                    return [time, item[0], 'linear'];
                  });

  return moveToByTime.apply(undefined, args);
}

var rotateToByTime = function()
{
  return SequenceAnimation.create({animations:makeAnimationsByTime(function(val, target)
                                                                   {
                                                                     target.exec("rotate", val);
                                                                   },
                                                                   Array.prototype.slice.call(arguments, 0))});
}

//[val, speed] [val, speed] ... [val]
var rotateToBySpeed = function()
{
  var args = Array.prototype.slice.call(arguments, 0)
  ,   time = 0;

  args = args.map(function(item, i, arr)
                  {
                    //update time
                    if (i == 0)
                    {
                      return [time, item[0], 'linear'];
                    }

                    var start = arr[i-1][0]
                    ,   end = arr[i][0];

                    time += Math.abs(end - start) / Math.abs(arr[i-1][1]);
                    
                    return [time, item[0], 'linear'];
                  });

  return rotateToByTime.apply(undefined, args);
}

var scaleToX = function(x1, x2, totalTime)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.exec("scaleX", val);
                           },
                           timeline:function(t)
                           {
                             var percent = t / totalTime;
                             return x1 + (x2 - x1) * percent;
                           },
                           totalTime:totalTime});
}

var scaleToY = function(y1, y2, totalTime)
{
  return Animation.create({variable:function(val, target)
                           {
                             target.exec("scaleY", val);
                           },
                           timeline:function(t)
                           {
                             var percent = t / totalTime;
                             return y1 + (y2 - y1) * percent;
                           },
                           totalTime:totalTime});
}

var scaleToByTime = function()
{
  return SequenceAnimation.create({animations:makeAnimationsByTime(function(val, target)
                                                                   {
                                                                     target.exec("scale", val.x, val.y);
                                                                   }, 
                                                                   Array.prototype.slice.call(arguments, 0))});

}

var scaleToBySpeed = function()
{
  var args = Array.prototype.slice.call(arguments, 0)
  ,   time = 0;

  args = args.map(function(item, i, arr)
                  {
                    //update time
                    if (i == 0)
                    {
                      return [time, item[0], 'linear'];
                    }

                    var xdist = arr[i][0].x - arr[i-1][0].x
                    ,   ydist = arr[i][0].y - arr[i-1][0].y;

                    time += Math.sqrt(xdist * xdist + ydist * ydist) / Math.abs(arr[i-1][1]);
                    
                    return [time, item[0], 'linear'];
                  });

  return scaleToByTime.apply(undefined, args);
}

//exports.Timeline = Timeline1;
exports.AnimationBase = AnimationBase;
exports.Animation = Animation;
exports.SequenceAnimation = SequenceAnimation;
exports.TimesAnimation = TimesAnimation;
exports.ParallelAnimation = ParallelAnimation;

exports.moveX = moveX;
exports.moveY = moveY;
exports.moveXY = moveXY;
exports.moveToX = moveToX;
exports.moveToY = moveToY;
exports.moveToByTime = moveToByTime;
exports.moveToBySpeed = moveToBySpeed;
exports.rotateToByTime = rotateToByTime;
exports.rotateToBySpeed = rotateToBySpeed;
exports.scaleToX = scaleToX;
exports.scaleToY = scaleToY;
exports.scaleToByTime = scaleToByTime;
exports.scaleToBySpeed = scaleToBySpeed;
exports.makeAnimationsByTime = makeAnimationsByTime;

exports.seq = function(animations)
{
  return SequenceAnimation.create({animations:animations});
};

exports.parallel = function(animations)
{
  return ParallelAnimation.create({animations:animations});
};

exports.times = function(animation, times)
{
  return TimesAnimation.create({animation:animation, times:times});
}

var Animator = Klass.extend(
  undefined,
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);
      this.slot("_animations", []);
    },

    update:function(t, target)
    {
      var hasDone = false;

      this.slot("_animations").forEach(function(animation, i, arr)
                                       {
                                         animation.exec("update", t, target);
                                         if (animation.exec("isDone"))
                                           hasDone = true;
                                       });

      if (!hasDone)
        return;

      this.slot("_animations", this.slot("_animations").filter(function(animation)
                                                               {
                                                                 return !animation.exec("isDone");
                                                               }));
    },

    addAnimation:function(animation)
    {
      this.slot("_animations").push(animation);
    },

    removeAnimation:function(id)
    {
      if (typeof(id) != "number")
        id = id.identifier;

      var idx = -1;

      this.slot("_animations").some(function(animation, i)
                                    {
                                      if (animation.identifier == id)
                                      {
                                        idx = i;
                                        return true;
                                      }
                                      else
                                        return false;
                                    });

      if (idx != -1)
        this.slot("_animations").splice(idx, 1);
    },

    removeAllAnimations:function()
    {
      this.slot("_animations", []);
      return true;
    },
  });

exports.linear = linear;
exports.set = set;
exports.discrete = discrete;
exports.sine = sine;
exports.sproing = sproing;
exports.square = square;
exports.cube = cube;
exports.sqrt = sqrt;
exports.curt = curt;
exports.reversetl = reversetl;
exports.slerptl = slerptl;
exports.maptl = maptl;
exports.foldltl = foldltl;
exports.addtl = addtl;
exports.subtl = subtl;
exports.multl = multl;
exports.lift = lift;
exports.consttl = consttl;
exports.Animator = Animator;
exports.tweenFunctions = tweenFunctions;

}};