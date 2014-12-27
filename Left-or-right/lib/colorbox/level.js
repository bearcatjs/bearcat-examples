
__resources__["/__builtin__/level.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var util = require("util")
  , debug = require("debug")
  , pipe = require('pipe')
  , TimeStamper = require("director").TimeStamper
  , Scene = require('scene').TreeScene
  , geo = require('geometry');


var Klass = require("base").Klass
,   Trait = require("oo").Trait;


var levelTrait = Trait.extend({
  initialize:function(param)
  {
    this.execProto("initialize");

    this.slot("_timeStamper", TimeStamper.create());
    this.slot("_sysPipe", pipe.createSwitcher());
    //this.slot("_sysPipe", pipe.createEventTrigger(this.slot("_timeStamper")));
    if (param && param.scene)
      this.slot("_scene", param.scene);
    else
      this.slot("_scene", Scene.create());

    this.slot("_deciders", {});
    
    // this.exec("registerDecider", 'hoverDecider', HoverEventDecider.create());
    // this.exec("registerDecider", 'mouseButtonDecider', MouseButtonEventDecider.create());
    // this.exec("registerDecider", 'keyDecider', KeyEventDecider.create());
    // this.exec("registerDecider", 'commonEventDecider', CommonEventDecider.create());
    this.exec("registerDecider", 'decider', CommonEventDecider.create());

    return this;
  },
  
  onActive: function(director)
  {
    this.slot("_sourcePipe", pipe.createEventTrigger(this.slot("_timeStamper")));
    pipe.switchSource(this.slot("_sysPipe"), this.slot("_sourcePipe"));
    this.slot("_scene").exec("onActive");
  },
  
  onDeactive: function()
  {
    this.slot("_scene").exec("onDeactive");
  },
  
  update: function(t, dt)
  {
    this.slot("_timeStamper").exec("stepForward", dt);
    this.slot("_scene").exec("update", t, dt);
    
    this.exec("decideEvents");
  },

  sysPipe:function()
  {
    return this.slot("_sysPipe");
  },
  
  switchPipeTriggerEvent:function(evt)
  {
    if(this.slot("_sourcePipe"))
      pipe.triggerEvent(this.slot("_sourcePipe"), evt);    
  },
  
  scene: function()
  {
    return this.slot("_scene");
  },

  setScene:function(scene)
  {
    this.slot("_scene", scene);
  },
  
  decideEvents:function()
  {
    var type, deciders = this.slot("_deciders");

    for (type in deciders)
    {
      if (!deciders.hasOwnProperty(type))
        continue;

      deciders[type].exec("decideEvent");
    }
  },
  
  registerDecider:function(type, decider)
  {
    this.slot("_deciders")[type] = decider;
  },

  removeDecider:function(type)
  {
    delete this.slot("_deciders")[type];
  },

  queryDecider:function(type)
  {
    return this.slot("_deciders")[type];
  },
});

var Level = Klass.extend([levelTrait]);


//resolve the events which nodes do not know how to dispatch
var deciderTrait = Trait.extend({
  initialize : function(param)
  {
    this.execProto("initialize");

    //hashmap<id, {event, waiters}>
    //waiters--> [{node,pipe}...]
    this.slot("_waiters", {});
  },
  
  decide:function(node, event, destPipe)
  {
    //FIXME: how to distinguish events
    var evtId = event.identifier;
    if (!this.slot("_waiters")[evtId])
      this.slot("_waiters")[evtId] = {event:event, waiters:[]};

    this.slot("_waiters")[evtId].waiters.push({node:node, pipe:destPipe});
  },
  
  decideEvent:function()
  {
    var evtId, waiter, waiters = this.slot("_waiters");

    for (evtId in waiters)
    {
      if (!waiters.hasOwnProperty(evtId))
        continue;

      waiter = waiters[evtId];
      this.exec("doDecideEvent", waiter.event, waiter.waiters);

      delete waiters[evtId];
    }
  },
  
  doDecideEvent:function(evt, dests)
  {
    debug.assert('cannot be here:decideEvent is base');
  },
  
  painter:function()
  {
    if (this.slot("_painter"))
      return this.slot("_painter");

    this.slot("_painter", require('director').director().exec("defaultPainter"));

    return this.slot("_painter");
  },
});

var Decider = Klass.extend([deciderTrait]);

var hitTest = function(painter, pos, node)
{
  var matrix = geo.matrixInvert(node.exec('matrix'));
  var newpos = geo.pointApplyMatrix({x:pos.x, y:pos.y}, matrix);

  //FIXME:test node._model
  return painter.exec("inside", node.exec("model"), newpos);
}

var hitTestNodesByZIndex = function(painter, pos, waiters)
{
  var hitOne, modelPath;

  var view = require("director").director().exec("defaultView");

  waiters.sort(function(a, b){
    //return b.node.exec('matrix').tz - a.node.exec('matrix').tz;
    return view.comparator(b.node, a.node, painter);
  }).some(function(waiter)
          {
            modelPath = hitTest(painter, pos, waiter.node);
            if (modelPath != false)
            {
              hitOne = waiter;
              return true;
            }
            return false;
          });

  if (hitOne)
  {
    return {waiter:hitOne,
            modelPath:typeof(modelPath) == "string" ? modelPath : undefined};
  }
}

var hoverEventDeciderTrait = Trait.extend({
  initialize : function(param)
  {
    this.execProto("initialize");
  },
  
  doDecideEvent:function(evt, waiters)
  {
    debug.assert(evt.type == 'mouseMoved', 'hovereventDecider receive unknown evtType:'+evt.type);
    
    var hitInfo = hitTestNodesByZIndex(this.exec("painter"), {x:evt.mouseX, y:evt.mouseY}, waiters);
    var targetNode = hitInfo ? hitInfo.waiter.node : undefined;

    //check mouseout
    if (this.slot("_activeNode") && 
        ((targetNode !== this.slot("_activeNode")) || hitInfo.modelPath != this.slot("_activeModelPath")))
    {
      var newEvt = util.copy(evt);
      newEvt.type = 'mouseOut';
      newEvt.modelPath = this.slot("_activeModelPath");

      pipe.triggerEvent(this.slot("_activePipe"), newEvt);

      this.slot("_activeNode", undefined);
      this.slot("_activeModelPath", undefined);
      this.slot("_activePipe", undefined);
    }

    //check mouseover
    if (targetNode && targetNode !== this.slot("_activeNode"))
    {
      this.slot("_activeNode", hitInfo.waiter.node);
      this.slot("_activeModelPath", hitInfo.modelPath);
      this.slot("_activePipe", hitInfo.waiter.pipe);

      var newEvt = util.copy(evt);
      newEvt.type = 'mouseOver';
      newEvt.modelPath = hitInfo.modelPath;

      pipe.triggerEvent(this.slot("_activePipe"), newEvt);
    }
  },
});

//HoverEventDecider = Decider.extend([hoverEventDeciderTrait]);

var shakeSpan = 10;

var mouseButtonEventDeciderTrait = Trait.extend({
  initialize : function(param)
  {
    this.execProto("initialize");
    
    this.slot("_hasPendDragEvt", false);
    this.slot("_dragTriggered", false);
  },
  
  doDecideEvent:function(evt, waiters)
  {
    debug.assert(evt.type == 'mouseClicked' || evt.type == 'mousePressed' ||
                 evt.type == 'mouseReleased' || evt.type == 'mouseDragged',
                 'I cannot decide event type:'+evt.type);

    switch (evt.type)
    {
    case 'mousePressed':
      if (this.slot("_pressedInfo"))
      {
        var evt1 = util.copy(this.slot("_pressedEvent"));

        if (this.slot("_hasPendDragEvt"))
        {
          evt1.type = 'mouseClicked';
          pipe.triggerEvent(this.slot("_pressedInfo").waiter.pipe, evt1);

          debug.assert(!this.slot("_dragTriggered"), 'mouseButtonDecider:logical error');
          this.slot("_hasPendDragEvt", false);
          this.slot("_dragTriggered", false);
        }

        evt1.type = 'mouseReleased';
        pipe.triggerEvent(this.slot("_pressedInfo").waiter.pipe, evt1);
        this.slot("_pressedInfo", undefined);
        this.slot("_pressedEvent", undefined);
      }

      var pressedInfo = hitTestNodesByZIndex(this.exec("painter"), {x:evt.mouseX, y:evt.mouseY}, waiters);

      if (pressedInfo)
      {
        this.slot("_pressedInfo", pressedInfo);
        this.slot("_pressedEvent", util.copy(evt));
        this.slot("_pressedEvent").modelPath = pressedInfo.modelPath;

        pipe.triggerEvent(this.slot("_pressedInfo").waiter.pipe, this.slot("_pressedEvent"));
      }
      break;

    case 'mouseReleased':
      if (this.slot("_pressedInfo"))
      {
        debug.assert(this.slot("_pressedEvent"), 'logical error!');
        
        if (this.slot("_hasPendDragEvt"))
        {
          var clickevt = util.copy(this.slot("_pressedEvent"));
          clickevt.type = 'mouseClicked';

          pipe.triggerEvent(this.slot("_pressedInfo").waiter.pipe, clickevt);
          this.slot("_hasPendDragEvt", false);
        }

        var releaseEvt = util.copy(evt);
        releaseEvt.modelPath = this.slot("_pressedInfo").modelPath;

        pipe.triggerEvent(this.slot("_pressedInfo").waiter.pipe, releaseEvt);

        this.slot("_pressedInfo", undefined);
        this.slot("_pressedEvent", undefined);
        this.slot("_dragTriggered", false);
      }
      break;

    case 'mouseClicked':
      if (this.slot("_pressedInfo"))
      {
        var clickedEvt = util.copy(evt);
        clickedEvt.modelPath = this.slot("_pressedEvent").modelPath;

        pipe.triggerEvent(this.slot("_pressedInfo").waiter.pipe, clickedEvt);
      }
      break;

    case 'mouseDragged':
      if (this.slot("_pressedInfo"))
      {
        var dragEvt = util.copy(evt);
        dragEvt.modelPath = this.slot("_pressedInfo").modelPath;

        if (this.slot("_dragTriggered"))
        {
          pipe.triggerEvent(this.slot("_pressedInfo").waiter.pipe, dragEvt);
          break;
        }

        this.slot("_hasPendDragEvt", true);

        if (!this.exec("testShake", this.slot("_pressedEvent"), evt))
        {
          this.slot("_hasPendDragEvt", false);
          this.slot("_dragTriggered", true);
          pipe.triggerEvent(this.slot("_pressedInfo").waiter.pipe, dragEvt);
        }
      }

      break;

    default:
      debug.assert(false, 'cannot be here!');
      break;
    }
  },

  testShake:function(evtPressed, evtDragged)
  {
    var distX = evtDragged.mouseX - evtPressed.mouseX;
    var distY = evtDragged.mouseY - evtPressed.mouseY;
    return (distX * distX + distY * distY) < shakeSpan * shakeSpan;
  },
});

//MouseButtonEventDecider = Decider.extend([mouseButtonEventDeciderTrait]);

var keyEventDeciderTrait = Trait.extend({
  initialize : function(param)
  {
    this.execProto("initialize");
  },
  
  doDecideEvent:function(evt, waiters)
  {
    debug.assert(evt.type == 'keyPressed' || evt.type == 'keyReleased', 
                 'I cannot decide event type:'+evt.type);

    var i, waiter;

    for (i=0; i<waiters.length; i++)
    {
      waiter = waiters[i];

      pipe.triggerEvent(waiter.pipe, evt);
    }
  },
});

//var KeyEventDecider = Decider.extend([keyEventDeciderTrait]);


var commonEventDeciderTrait = Trait.extend({
  initialize : function(param)
  {
    this.execProto("initialize");
  },
  
  doDecideEvent:function(evt, waiters)
  {
    var i, waiter;

    for (i=0; i<waiters.length; i++)
    {
      waiter = waiters[i];

      pipe.triggerEvent(waiter.pipe, evt);
    }
  },
});

//var CommonEventDecider = Decider.extend([commonEventDeciderTrait]);

var CommonEventDecider = Decider.extend(
  [
    hoverEventDeciderTrait.rename({
      initialize:"hoverEvtDeciderInit",
      doDecideEvent:"doDecideHoverEvent",
    }),

    mouseButtonEventDeciderTrait.rename({
      initialize:"mouseEvtDeciderInit",
      doDecideEvent:"doDecideMouseButtonEvent"
    }),

    keyEventDeciderTrait.rename({
      initialize:"keyEvtDeciderInit",
      doDecideEvent:"doDecideKeyEvent"
    }),

    commonEventDeciderTrait.rename({
      initialize:"commonEvtDeciderInit",
      doDecideEvent:"doDecideCommonEvent"
    })],

  {
    initialize:function(param)
    {
      this.exec("hoverEvtDeciderInit");
      this.exec("mouseEvtDeciderInit");
      this.exec("keyEvtDeciderInit");
      this.exec("commonEvtDeciderInit");
    },

    doDecideEvent:function(evt, waiters)
    {
      switch(evt.type)
      {
      case "mouseMoved":
        return this.exec("doDecideHoverEvent", evt ,waiters);
      case "mouseClicked":
      case "mousePressed":
      case "mouseReleased":
      case "mouseDragged":
        return this.exec("doDecideMouseButtonEvent", evt, waiters);
      case "keyPressed":
      case "keyReleased":
        return this.exec("doDecideKeyEvent", evt, waiters);
      case "mouseOver":
      case "mouseOut":
        return;
      default:
        return this.exec("doDecideCommonEvent", evt, waiters);
      }
    },
  }
);

exports.Level = Level;

}};