
__resources__["/__builtin__/director.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var util = require("util")
  , debug = require("debug")
  , pipe = require('pipe')
  , helper = require('helper')
  , view = require('view')
  , painter = require("painter")
  , model = require('model')
  , globalClocker = require('clocker').globalClocker
  , topview = view.topView
  , geo = require("geometry");

/*----------------------------------------------------------------------------*/
var Klass = require("base").Klass
,   Trait = require("oo").Trait;


var timeStamperTrait = Trait.extend({
  initialize:function(param)
  {
    this.execProto("initialize");
    
    param = param || {};
    
    if (param.startTime != undefined)
      this.slot("_startTime", param.startTime);
    else
      this.slot("_startTime", 0);
      
    this.slot("_curTime", this.slot("_startTime"));
    
    if (param.step != undefined)
      this.slot("_step", param.step);
    else
      this.slot("_step", 1);
      
    return this;   
  },
  
  stepForward:function(dt)
  {
    if (dt != undefined)
      this.slot("_curTime", this.slot("_curTime") + dt);
    else
      this.slot("_curTime", this.slot("_curTime") + this.slot("_step"));
  },
  
  adjust:function(t)
  {
    this.slot("_curTime", t);
  },

  now:function()
  {
    return this.slot("_curTime");
  },
});

var TimeStamper = Klass.extend([timeStamperTrait]);

var timeStamp = TimeStamper.create();

//event helper functions
function createMouseEvtHdl(d, type)
{
  return function(e)
  {
    var evt = {type:type};
    
    // evt.mouseX = d.slot("_defaultPainter").exec("sketchpad").mouseX;
    // evt.mouseY = d.slot("_defaultPainter").exec("sketchpad").mouseY;
    // evt.pmouseX = d.slot("_defaultPainter").exec("sketchpad").pmouseX;
    // evt.pmouseY = d.slot("_defaultPainter").exec("sketchpad").pmouseY;
    //donot permit event.id is copyable through util.copy in for..in.. expression
    //Object.defineProperty(evt, 'id', {value:eventIdGenerator++, writable:true, configurable:true, enumerable:false});
    //evt.id = eventIdGenerator ++;

    evt.mouseX = e.x;
    evt.mouseY = e.y;

    d.exec("triggerEvent", evt);
  };
}

function createKeyEvtHdl(d, type)
{
  return function(e)
  {
    var evt = {type:type};
  
    // evt.key = d.slot("_defaultPainter").exec("sketchpad").key;
    // evt.keyCode = d.slot("_defaultPainter").exec("sketchpad").keyCode;
    
    //donot permit event.id is copyable through util.copy in for..in.. expression
    //Object.defineProperty(evt, 'id', {value:eventIdGenerator++, writable:true, configurable:true, enumerable:false});
    //evt.id = eventIdGenerator ++;

    evt.key = e.key;
    evt.keyCode = e.keyCode;

    d.exec("triggerEvent", evt);
  };
}

function redrawLevel2Painter(level, painter)
{
  var displayList = [];
  painter.exec("clear");
  //level.exec("scene").exec("filt", displayList, function(node){return !!node.exec("model");});      
  //painter.exec("redraw", displayList);
  
  director().exec("defaultView")(painter, level.exec("scene"))
}

function transAndDraw(d, t)
{
  var setLevelInfo = d.slot("_setLevelList")[0];
  var preLevel = d.slot("_level"), 
      nextLevel = setLevelInfo.nextLevel,
      transInfo = setLevelInfo.transInfo;

  if(transInfo.exec("isDone"))
  {
    d.slot("_level", nextLevel);
    if (d.slot("_level"))
      d.slot("_level").exec("onActive", d);
    
    d.slot("_preLevelPainter").exec("sketchpad").canvas.loaded = false;
    d.slot("_preLevelModel", undefined);
    d.slot("_nextLevelPainter").exec("sketchpad").canvas.loaded = false;
    d.slot("_nextLevelModel", undefined);
  
    d.slot("_setLevelList").splice(0, 1);
    if(d.slot("_setLevelList").length > 0)
    {
      d.slot("_preLevelModel", model.ImageModel.create({image:d.slot("_preLevelPainter").exec("sketchpad").canvas}));
      d.slot("_nextLevelModel", model.ImageModel.create({image:d.slot("_nextLevelPainter").exec("sketchpad").canvas}));
      setLevelInfo = d.slot("_setLevelList")[0];
      preLevel = d.slot("_level");
      nextLevel = setLevelInfo.nextLevel;
      transInfo = setLevelInfo.transInfo;
    }
    else
    {
      return true;
    }
  }

  if(preLevel && d.slot("_preLevelPainter").exec("sketchpad").canvas.loaded === false)
  {
    redrawLevel2Painter(preLevel, d.slot("_preLevelPainter"));
    d.slot("_preLevelPainter").exec("sketchpad").canvas.loaded = true;
    preLevel.exec("onDeactive");
  }
  if(nextLevel && d.slot("_nextLevelPainter").exec("sketchpad").canvas.loaded === false)
  {
    redrawLevel2Painter(nextLevel, d.slot("_nextLevelPainter"));
    d.slot("_nextLevelPainter").exec("sketchpad").canvas.loaded = true;
  }

  var displayList = transInfo.exec("trans", d.slot("_preLevelModel"), d.slot("_nextLevelModel"), t);

  d.slot("_defaultPainter").exec("clear");
  d.slot("_defaultPainter").exec("drawDispList", displayList);
  
  return false;
}

var __instance__;
var eventIdGenerator = 0;

var directorTrait = Trait.extend({
  initialize:function(param)
  {
    if (__instance__)
      return __instance__;

    this.execProto("initialize");
    
    this.slot("_timeStamper", TimeStamper.create());
    this.slot("_globalTimeStamper", TimeStamper.create());
    this.slot("_sysPipe", pipe.createEventTrigger(this.slot("_timeStamper")));
    
    debug.assert(param.painter, 'param error');
    
    this.slot("_defaultPainter", param.painter);
    this.slot("_displayList", []);
    this.slot("_now", 0);

    if (param.gameWorldToViewMatrix)
      this.slot("_gameWorldToViewMatrix", param.gameWorldToViewMatrix);
    else
      this.slot("_gameWorldToViewMatrix", geo.identityMatrix());

    if (param.view)
      this.slot("_defaultView", param.view);
    else
      this.slot("_defaultView", topview);

    this.exec("registerEvents");

    __instance__ = this;
    
    var self = this;
    var clockf = function()
    {
      return self._now;
    };
    
    globalClocker(clockf);
  },

  globalTimeStamper:function()
  {
    return this.slot("_globalTimeStamper");
  },

  getGameWorldToViewMatrix:function()
  {
    return this.slot("_gameWorldToViewMatrix");
  },

  setGameWorldToViewMatrix:function(mat)
  {
    return this.slot("_gameWorldToViewMatrix", util.copy(mat));
  },
  
  registerEvents:function()
  {
    this.slot("_defaultPainter").exec("eventDecider").mouseClicked = createMouseEvtHdl(this, 'mouseClicked');
    this.slot("_defaultPainter").exec("eventDecider").mouseDragged = createMouseEvtHdl(this, 'mouseDragged');
    this.slot("_defaultPainter").exec("eventDecider").mouseMoved = createMouseEvtHdl(this, 'mouseMoved');
    this.slot("_defaultPainter").exec("eventDecider").mouseOut = createMouseEvtHdl(this, 'mouseOut');
    this.slot("_defaultPainter").exec("eventDecider").mouseOver = createMouseEvtHdl(this, 'mouseOver');
    this.slot("_defaultPainter").exec("eventDecider").mousePressed = createMouseEvtHdl(this, 'mousePressed');
    this.slot("_defaultPainter").exec("eventDecider").mouseReleased = createMouseEvtHdl(this, 'mouseReleased');
    
    this.slot("_defaultPainter").exec("eventDecider").keyPressed = createKeyEvtHdl(this, 'keyPressed');
    this.slot("_defaultPainter").exec("eventDecider").keyReleased = createKeyEvtHdl(this, 'keyReleased');
  },
  
  triggerEvent:function(evt)
  {
    if (this.slot("_level"))
    {
      this.slot("_level").exec("switchPipeTriggerEvent", evt);
    }
  },
  
  update:function(t, dt)
  {
    //this.slot("_timeStamper").exec("stepForward", dt);
    this.slot("_timeStamper").exec("adjust", t);
    this.slot("_globalTimeStamper").exec("adjust", t);

    //fixme:sound may be need adjust, global clocker will get real time
    //this.slot("_now", this.slot("_now") + 1);
    this.slot("_now",  t);

    //allways check mouseover, mouseout.
    if (!this.slot("_defaultPainter").exec("eventDecider").isMousePressed())
    {
      //createMouseEvtHdl(this, 'mouseMoved')();
    }

    if(this.slot("_setLevelList") && this.slot("_setLevelList").length > 0)
    {
      if(transAndDraw(this, t) == false)
        return;
    }
    if (this.slot("_level"))
    {
      this.slot("_level").exec("update", t, dt);
      // this.slot("_displayList").length = 0;
      // this.slot("_level").exec("scene").exec("filt", this.slot("_displayList"), function(node){return !!node.exec("model");}); 
      
      this.slot("_defaultPainter").exec("clear");
      // this.slot("_defaultPainter").exec("redraw", this.slot("_displayList"));
      this.slot("_defaultView")(this.slot("_defaultPainter"), this.slot("_level").exec("scene"));
    }
  },
  
  setLevel:function(level, transInfo)
  {      
    if(!transInfo)
    {
      if (this.slot("_level") === level)
        return;

      if (this.slot("_level"))
        this.slot("_level").exec("onDeactive");
      
      this.slot("_level", level);
      if (this.slot("_level"))
        this.slot("_level").exec("onActive");
    }
    else
    {
      if(!this.slot("_setLevelList"))
        this.slot("_setLevelList", []);
      this.slot("_setLevelList").push({nextLevel:level, transInfo:transInfo});

      if(!this.slot("_preLevelPainter"))
      {
        var sketchpad = helper.createHiddenSketchpad(this.exec("defaultPainterWidth"), this.exec("defaultPainterHeight"));

        this.slot("_preLevelPainter", painter.HonestPainter.create(sketchpad)); 
      }
      if(this.slot("_preLevelModel") == undefined)
        this.slot("_preLevelModel", model.ImageModel.create({image:this.slot("_preLevelPainter").exec("sketchpad").canvas}));
      
      if(this.slot("_preLevelPainter"))
        this.slot("_preLevelPainter").exec("sketchpad").canvas.loaded = false;

      if(!this.slot("_nextLevelPainter"))
      {
        var sketchpad = helper.createHiddenSketchpad(this.exec("defaultPainterWidth"), this.exec("defaultPainterHeight"));

        this.slot("_nextLevelPainter", painter.HonestPainter.create(sketchpad));
      }
      if(this.slot("_nextLevelModel") == undefined)
        this.slot("_nextLevelModel", model.ImageModel.create({image:this.slot("_nextLevelPainter").exec("sketchpad").canvas}));
      if(this.slot("_nextLevelPainter"))
        this.slot("_nextLevelPainter").exec("sketchpad").canvas.loaded = false;
    }
  },
  
  getLevel:function()
  {
    return this.slot("_level");
  },
  
  sysPipe:function()
  {
    return this.slot("_sysPipe");
  },

  defaultPainter:function()
  {
    return this.slot("_defaultPainter");
  },
  
  defaultView:function()
  {
    return this.slot("_defaultView");
  },

  defaultPainterWidth:function()
  {
    return this.slot("_defaultPainter").exec("sketchpad").canvas.width;
  },
  
  defaultPainterHeight:function()
  {
    return this.slot("_defaultPainter").exec("sketchpad").canvas.height;
  },
  
  getCurrentLevelImgModel:function()
  {    
    var sketchpad = helper.createHiddenSketchpad(this.exec("defaultPainterWidth"), this.exec("defaultPainterHeight"));
    var prePainter = painter.HonestPainter.create(sketchpad);
    
    redrawLevel2Painter(this.slot("_level"), prePainter);
    
    prePainter.exec("sketchpad").canvas.loaded = true;
    return model.ImageModel.create({image:prePainter.exec("sketchpad").canvas});
  },
});

var Director = Klass.extend([directorTrait]);

function director(param)
{
  if (!__instance__)
  {
    __instance__ = Director.create(param);
  }

  return __instance__;
}


exports.Director = Director;
exports.director = director;
exports.timeStamp = timeStamp;
exports.TimeStamper = TimeStamper;

}};