
__resources__["/__builtin__/actortraits.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var Trait = require("oo").Trait
  , util = require("util")
  , debug = require("debug")
  , Animator = require('animate').Animator
  , TimeStamper = require('director').TimeStamper
  , pipe = require('pipe')
  , ClipModel = require("model").ClipModel
  , ImageModel = require("model").ImageModel

var animatorTrait = Trait.extend({
  initialize:function(param)
  {
    this.exec("querySatelliteData", "_animator", Animator.create()); 

    var update = function(t, actor)
    {
      var animator = actor.exec("satelliteData", "_animator");

      animator.exec("update", t, actor);
    };

    this.exec("regUpdate", update);
  },
  
  addAnimation:function(animation, node, bSmooth)
  {
    var animator = this.exec("satelliteData", "_animator");

    animator.exec("addAnimation", animation);

    if (!bSmooth)
      animation.exec("prepare");
  },
  
  removeAnimation:function(id)
  {
    this.exec("satelliteData", "_animator").exec("removeAnimation", id);
  },

  removeAllAnimations:function()
  {
    this.exec("satelliteData", "_animator").exec("removeAllAnimations");
  },
});

var msgUpdate = function(t, actor)
{
  var data = actor.exec("satelliteData", "_messageTrait");
  var pMsg = data._port.query()
  , msg
  
  while(pMsg)
  {
    msg = pMsg.content;
    
    if (data._callback)
      data._callback(msg, actor);
    
    pMsg = data._port.query();
  }

  data._timeStamper.exec("stepForward");
};

var messageTrait = Trait.extend({
  initialize:function(param)
  {
    var data = this.exec("querySatelliteData", "_messageTrait", {});

    data._timeStamper = TimeStamper.create();
    data._pipe = pipe.createEventTrigger(data._timeStamper);
    data._port = pipe.createPort(data._pipe);
    data._callback = param.callback;

    this.exec("regUpdate", msgUpdate);
  },
  
  sendMessage:function(msg)
  {
    pipe.triggerEvent(this.exec("satelliteData", "_messageTrait")._pipe, msg);
  },
});

var baseEventHandleTrait = Trait.extend({
  toDecideAllEvents:function(sourcePort, decider, actor, destPipe)
  {
    var pEvt = sourcePort.query();
    var event;

    while (pEvt)
    {
      event = pEvt.content;

      decider.exec("decide", actor, event, destPipe);
      
      pEvt = sourcePort.query();
    }
  },
});

var evtUpdate = function(t, actor)
{
  var data = actor.exec("_evtHdlData");

  data._timeStamper.exec("stepForward");

  actor.exec("_handleEvent", actor);

  actor.exec("toDecideAllEvents", data._port, data._decider, actor, data._selfPipe);
};

var eventHandleTrait = baseEventHandleTrait.extend({
  initialize:function(param)
  {
    var data = this.exec("_evtHdlData");
    debug.assert(data, "cannot get namespace");

    if (undefined == param.pipe && param.level)
    {
      data._oriPipe = param.level.exec("sysPipe");
    }
    else
      this._oriPipe = param.pipe;

    if (undefined == param.decider && param.level)
    {
      data._decider = param.level.exec("queryDecider", "decider");
    }
    else
      this._decider = param.decider;

    //data._port = pipe.createPort(data._oriPipe);
    this._port = undefined;
    data._cbs = [];
    data._timeStamper = TimeStamper.create();

    data._selfPipe = pipe.createEventTrigger(data._timeStamper);
    data._selfPort = pipe.createPort(data._selfPipe);

    //this.exec("regUpdate", evtUpdate);
  },

  _evtHdlData:function()
  {
    var data = this.exec("satelliteData", "EventHandle");
    if (data)
      return data;

    return this.exec("querySatelliteData", "EventHandle", {});
  },

  _handleEvent:function()
  {
    var data = this.exec("_evtHdlData")
    ,   pEvt = data._selfPort.query()
    ,   event;

    while (pEvt)
    {
      event = pEvt.content;

      if (data._cbs[event.type])
        data._cbs[event.type](event, this);

      pEvt = data._selfPort.query();
    }
  },

  addEventListener:function(name, cb)
  {
    var data = this.exec("_evtHdlData");

    if (data._port == undefined)
    {
      data._port = pipe.createPort(data._oriPipe);

      if (data._oriPipe && data._decider)
        this.exec("regUpdate", evtUpdate);
      else
      {
        debug.warning("this actor donot knwon where to query event and how to decide events");
      }
    }

    if (data._cbs[name] != undefined)
    {
      this._cbs[name] = cb;
      return;
    }

    data._cbs[name] = cb;

    return;
  },

  setEventPipe:function(p)
  {
    var data = this.exec("_evtHdlData");
    var oriPipe = data._oriPipe;

    data._oriPipe = p;
    
    return oriPipe;
  },

  setEventDecider:function(d)
  {
    var data = this.exec("_evtHdlData");
    var oridecider = data._decider;
    
    data._decider = d;
    return oridecider;
  },

  removeEventListener:function(name)
  {
    var data = this.exec("_evtHdlData");
    delete data._cbs[name];

    if (data._cbs.length == 0)
    {
      data._port = undefined;
      this.exec("unRegUpdate", evtUpdate);
    }
  },
});

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
var frameUpdate = function(t, actor)
{
  var data = actor.exec("satelliteData", "frame");

  var imgWidth = data._clipModel.get("model").get("width");
  var imgHeight = data._clipModel.get("model").get("height");
  var endX = data._endX == -1 ? imgWidth : data._endX;
  var endY = data._endY == -1 ? imgHeight : data._endY;
  var compelete = false;

  dt = dt * data._factor;

  if (data._times == 0)
    return;

  data._elapsed += dt;
  
  while (data._elapsed >= data._interval)
  {
    data._elapsed -= data._interval;
    
    data._x += data._hSpan;

    //jump to next line?
    if (data._x >= imgWidth)
    {
      data._x = 0;
      data._y += data._vSpan;
    }

    //check if frame play over
    if (((data._x+data._hSpan) > endX && (data._y+data._vSpan) == endY) ||
        (data._y + data._vSpan) > endY)
    {
      data._times --;
      
      data._x = data._startX;
      data._y = data._startY;

      if (0 == data._times)
        break;
    }
  }

  data._clipModel.get("x") = data._x;
  data._clipModel.get("y") = data._y;
};

var frameSeqTrait = Trait.extend({
  initialize:function(param)
  {
    var data = this.exec("querySatelliteData", "frame", {});

    var imgModel = new ImageModel({image:param.image});
    data._clipModel = new ClipModel({w:param.w, h:param.h, model:imgModel});

    if (typeof(param.HSpan) == 'number')
      data._hSpan = param.HSpan;
    else
      data._hSpan = param.w;

    if (typeof(param.VSpan) == 'number')
      data._vSpan = param.VSpan;
    else
      data._vSpan = param.h;

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

    data._startX = startFrame.x * param.w;
    data._startY = startFrame.y * param.h;
    data._endX = endFrame.x == -1 ? -1 : endFrame.x * param.w;
    data._endY = endFrame.y == -1 ? -1 : endFrame.y * param.h;

    if (typeof(param.times) == 'number')
      data._times = param.times;
    else
      data._times = 1;

    data._interval = param.interval;

    if (typeof(param.factor) == 'number')
      data._factor = param.factor;
    else
      data._factor = 1;

    data._clipModel.x = data._x = data._startX;
    data._clipModel.y = data._y = data._startY;

    data._elapsed = 0;

    this.exec("regUpdate", frameUpdate);
  },

  _frameData: function()
  {
    return this.exec("satelliteData", "frame");
  },

  setFrameSeqFactor:function(factor)
  {
    debug.assert(typeof(factor) == "number", "frameseq component setFrameSeqFactor parameter error");
    
    this.exec("satelliteData", "frame")._factor = factor;
  },

  getModel:function()
  {
    return this.exec("satelliteData", "frame")._clipModel;
  },
});

var emitterTrait = Trait.extend({
  initialize:function(param)
  {
    debug.assert(param.emitter, "parameter error");

    this.exec("querySatelliteData", "emitter", param.emitter);

    var update = function(t, actor)
    {
      actor.exec("querySatelliteData", "emitter").exec("update", dt, null, {});
    };
    
    this.exec("regUpdate", update);
  },

  getEmitter:function()
  {
    return this.exec("querySatelliteData", "emitter");
  },
});

var buildingTrait = Trait.extend(
  {
     initialize:function(param)
     {
       //EmitterComponent.superClass.init.call(this, param);
       debug.assert(param.mapData, "parameter error");
        
       this._mapData = param.mapData;
       this.slot("__mapdata", param.mapData);
     },
     
     isBuilding:function(host)
     {
        return true;
     },
     
     mapData:function(host)
     {
       return this.slot("__mapdata");
     },
  });

var listenPortsTrait = Trait.extend(
  {
    listenPortsTraitInitialize:function(param)
    {
      debug.assert(this.slot("__listenedPorts") == undefined, "data confict");

      this.slot("__listenedPorts", {});
    },

    addListenedPort:function(port, name)
    {
      var listenedPorts = this.slot("__listenedPorts");
      
      debug.assert(listenedPorts[name] == undefined, "add same name port");

      listenedPorts[name] = {port:port, callbacks:[]};
    },

    rmListenedPort:function(name)
    {
      var listenedPorts = this.slot("__listenedPorts");
      
      if (name)
      {
        debug.assert(listenedPorts[name] != undefined, "donot exist port:"+name);
        delete listenedPorts[name];        
      }
      else
      {
        this.slot("__listenedPorts", {})
      }
    },
    
    addListenedPortCB:function(name, cb)
    {
      var listenedPorts = this.slot("__listenedPorts");
      
      debug.assert(listenedPorts[name] != undefined, "do not exist port by :" + name);
      debug.assert(listenedPorts[name].callbacks.indexOf(cb) == -1, "add same call to port:" + name);
      
      listenedPorts[name].callbacks.push(cb);
    },

    rmListenedPortCB:function(name, cb)
    {
      var listenedPorts = this.slot("__listenedPorts");
      
      debug.assert(listenedPorts[name] != undefined, "do not exist port by :" + name);
      
      if (undefined == cb)
      {
        listenedPorts[name].callbacks.length = 0;
      }
      else
      {
        var idx = listenedPorts[name].callbacks.indexOf(cb);
        debug.assert(idx != -1, "donot exist cb in port:" + name);
        
        listenedPorts[name].callbacks.splice(idx, 1);
      }
    },
  });

exports.animatorTrait = animatorTrait;
exports.emitterTrait = emitterTrait;
exports.frameSeqTrait = frameSeqTrait;
exports.messageTrait = messageTrait;
exports.eventHandleTrait = eventHandleTrait;
exports.buildingTrait = buildingTrait;
exports.listenPortsTrait = listenPortsTrait;

}};