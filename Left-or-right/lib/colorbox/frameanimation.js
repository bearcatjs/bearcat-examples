
__resources__["/__builtin__/frameanimation.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var animate = require("animate");
var ImageModel = require("model").ImageModel;
var ClipModel = require("model").ClipModel;
var debug = require("debug");
var h = require("helper");
var util = require("util");
/*
**1,image

**2,w:frame width
**3,h:frame height

**4,HSpan:default is w
**5,VSpan:default is h

**6,startFrame:index of start frame
**7,endFrame:index of end frame

**8,times:default is 1.
**9,interval:

**10,factor:
*/
var genFrameTimeline = function(imgModel, HSpan, VSpan, startX, startY, interval, totalTime)
{
  var lastElapsed = 0;
  var elapsed = 0;/*record elapsed time during last time x, y changed*/
  var x = startX;
  var y = startY;

  return function(p)
  {
    var curElapsed = p * totalTime;
    var dt = curElapsed - lastElapsed;

    elapsed += dt;
    lastElapsed = curElapsed;

    var imgWidth = imgModel.slot("width");
    var imgHeight = imgModel.slot("height");

    //因为序列帧动画是一个闭开区间，当percent为1的时候，不应该取到下一帧，应还是最后一帧。 所以在判断的时候不应该使用elapsed >= interval
    while (elapsed > interval)
    {
      elapsed -= interval;
      
      x += HSpan;

      //jump to next line?
      if (x >= imgWidth)
      {
        x = 0;
        y += VSpan;
      }

      debug.assert(x < imgWidth && y < imgHeight, "logical error");
    }

    return {x:x, y:y};
  };
};

var FrameAnimation = animate.AnimationBase.extend(
  undefined,
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);

      this.slot("_imgModel", ImageModel.create({image:param.image}));
      this.slot("_target", ClipModel.create({w:param.w, h:param.h, model:this.slot("_imgModel")}));

      if (typeof(param.HSpan) == 'number')
        this.slot("_hSpan", param.HSpan);
      else
        this.slot("_hSpan", param.w);

      if (typeof(param.VSpan) == 'number')
        this.slot("_vSpan" , param.VSpan);
      else
        this.slot("_vSpan", param.h);

      var startFrame = {x:0, y:0};
      if (typeof(param.startFrame) == 'number')
      {
        startFrame.x = param.startFrame;
        startFrame.y = 0;
      }
      else if (param.startFrame)
      {
        startFrame = param.startFrame;
      }
      
      var endFrame = {x:-1, y:-1};
      if (typeof(param.endFrame) == "number")
      {
        endFrame.x = param.endFrame;
        endFrame.y = 1;
      }
      else if (param.endFrame)
      {
        endFrame = param.endFrame;
      }

      debug.assert((typeof(startFrame.x) == 'number' && 
                    typeof(startFrame.y) == 'number' &&
                    typeof(endFrame.x) == 'number' &&
                    typeof(endFrame.y == 'number')), "parameter error");

      this.slot("_startX", startFrame.x * param.w);
      this.slot("_startY", startFrame.y * param.h);
      this.slot("_endX", endFrame.x == -1 ? -1 : endFrame.x * param.w);
      this.slot("_endY", endFrame.y == -1 ? -1 : endFrame.y * param.h);

      debug.assert(typeof(param.totalTime) == "number" && typeof(param.interval) == "number", "parameter error!");
      this.slot("_totalTime", param.totalTime);
      this.slot("_interval", param.interval);

      if (typeof(param.factor) == 'number')
        this.slot("_factor", param.factor);
      else
        this.slot("_factor", function(t){return t;});

      this.slot("_target").x = this.slot("_startX");
      this.slot("_target").y = this.slot("_startY");

      this.slot("_timeline", genFrameTimeline(this.slot("_imgModel"), this.slot("_hSpan"), this.slot("_vSpan"), this.slot("_startX") , this.slot("_startY"), this.slot("_endX"), this.slot("_endY"), this.slot("_interval"), this.slot("_totalTime")));
    },
    
    doPrepare: function()
    {
      this.slot("_timeline", genFrameTimeline(this.slot("_imgModel"), this.slot("_hSpan"), this.slot("_vSpan"), this.slot("_startX"), this.slot("_startY"), this.slot("_interval"), this.slot("_totalTime")));
    },
        
    doUpdate: function(t, target)
    {
      var percent = t / this.exec("totalTime");
      
      if (percent > 1)
        percent = 1;

      var val = this.slot("_timeline")(percent);
      this.slot("_target").slot("x", val.x);
      this.slot("_target").slot("y", val.y);
    },

    
    target: function ()
    {
      return this.slot("_target");
    },

    elapsed:function()
    {
      return this.slot("_elapsed");
    },

    totalTime:function()
    {
      return this.slot("_totalTime");
    },

    value:function(time)
    {
      var value = {variable:["x", "y"]};
      
      time = time > this.slot("_totalTime") ? this.slot("_totalTime") : time;

      var percent = time / this.slot("_totalTime");
      percent = percent >= 1.0 ? 0.99 : percent;

      value.value = this.slot("_timeline")(percent);

      return [value];
    },
  });

/*
  Oneway to define a FrameData:
  example for FrameData:
  KeyFrame:
  var frame1 = {
     offset:{x:0, y:0},
     size:{w:80, h:40},
  };

  var frame2 = {
     offset:{x:80, y:0},
     size:{w:80, h:40},
  };

  FrameData:
  {
    image:"images/bird.png",
    keyFrames:
      [
        {frame:frame1,duration:200},
        {frame:frame2,duration:200},
      ]
  }

  很难做到每帧都可以是不同的图片资源，因为node不会主动去切换clipModel
*/

var genFramesDetailTimeline = function(frameData)
{
  var totalTime = 0;
  frameData.keyFrames.forEach(function(keyFrame)  
                              {
                                totalTime += keyFrame.duration;
                              });
  return function(p)
  {
    var elapsed = p * totalTime;
    var frame;

    frameData.keyFrames.some(function(keyFrame)
                             {
                               if (elapsed <= keyFrame.duration)
                               {
                                 frame = keyFrame.frame;
                                 return true;
                               }
                               else
                               {
                                 elapsed -= keyFrame.duration;
                                 return false;
                               }
                             });

    if (frame == undefined && frameData.keyFrames.length > 0)
      frame = frameData.keyFrames[frameData.keyFrames.length-1].frame;

    return frame;
  }
}

var DetailedFrameAnimation = animate.AnimationBase.extend(
  undefined,
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);

      var image;
      if (typeof(param.image) == "string")
      {
        image = h.loadImage(param.image);
      }
      else
      {
        image = param.iamge;
      }

      this.slot("_imgModel", ImageModel.create({image:image}));
      this.slot("_target", ClipModel.create({w:0, h:0, model:this.slot("_imgModel")}));

      var totalTime = 0;
      param.keyFrames.forEach(function(keyFrame)
                              {
                                totalTime += keyFrame.duration;
                              });
      this.slot("_totalTime", totalTime);
      this.slot("_frameData", util.copy(param));
      this.slot("_frameData").image = image;
      if (this.slot("_frameData").factor == undefined)
        this.slot("_frameData").factor = function(t){return t;};

      this.slot("_timeline", genFramesDetailTimeline(this.slot("_frameData")));
    },
    
    doPrepare: function()
    {
      this.slot("_timeline", genFramesDetailTimeline(this.slot("_frameData")));
    },

    doUpdate: function(t, target)
    {
      var frame = this.slot("_timeline")(t/this.slot("_totalTime"));

      debug.assert(this.slot("_target") || target, "Animation, there is no target!");
      debug.assert(typeof(frame.offset.x) == "number" && typeof(frame.offset.y) == "number" && typeof(frame.size.w) == "number" && typeof(frame.size.h) == "number",
                   "the value which timeline calc is wrong");
      this.slot("_target").slot("w", frame.size.w);
      this.slot("_target").slot("h", frame.size.h);
      this.slot("_target").slot("x", frame.offset.x);
      this.slot("_target").slot("y", frame.offset.y);
    },
    
    target: function ()
    {
      return this.slot("_target");
    },

    totalTime:function()
    {
      return this.slot("_totalTime");
    },

    variable:function()
    {
      return ["w", "h", "x", "y"];
    },

    value:function(time, percent)
    {
      var value = {variable:this.variable()};

      time = time > this.slot("_totalTime") ? this.slot("_totalTime") : time;

      value.value = this.slot("_timeline")(t / this.slot("_totalTime"));

      return [value];
    },
  });

exports.FrameAnimation = FrameAnimation;
exports.DetailedFrameAnimation = DetailedFrameAnimation;

}};