
__resources__["/__builtin__/scene.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var debug = require("debug")
  , NTreeNode = require("node").NTreeNode
  , pipe = require('pipe')
  , TimeStamper = require('director').TimeStamper
  , geo = require('geometry')
  , Klass = require("base").Klass
  , Trait = require("oo").Trait;

var sceneTrait = Trait.extend({
  initialize:function(param)
  {
    this.execProto("initialize");
    
    this.slot("_timeStamper", TimeStamper.create());
    this.slot("_pipe", pipe.createEventTrigger(this.slot("_timeStamper")));
  },

  addNode:function()
  {
    debug.error('cannot be here');
  },
  
  pipe:function()
  {
    return this.slot("_pipe");
  },
  
  onActive: function(logic)
  {
    pipe.triggerEvent(this.slot("_pipe"), {eventType:'onActive'});
  },
  
  onDeactive: function()
  {
    pipe.triggerEvent(this.slot("_pipe"), {eventType:'onDeactive'});
  },
  
  update: function(t, dt)
  {
    this.exec("doUpdate", t,dt);
  },
  
  filt:function(filter)
  {
    debug.error('cannot be here');
  },
});

var Scene = Klass.extend([sceneTrait]);

var treeSceneTrait = Trait.extend({
  initialize:function(param)
  {
    this.execProto("initialize");
    
    this.slot("_root", NTreeNode.create({scene:this}));
    this.slot("_root").slot("_isInScene", true);

    this.slot("_filtChildren", []);
    this.slot("_filtChildrenDirty", true);
    this.slot("_filtPara", undefined);

    var actorsMap = {};
    this.slot("_actorsMap", actorsMap);
  },

  doUpdate: function (t, dt)
  {
    this.slot("_timeStamper").exec("stepForward", dt);
    
    this.slot("_root").exec("traverse", 
                    function (node) 
                    { 
                      node.tryExec("update", t,dt); 
                    });
  },
  
  addNode:function(node, path)
  {
    if (path === undefined)
    {
      this.slot("_root").exec("appendChild", node);
    }
    else
    {
      path.exec("appendChild", node);
    }
    
    this.slot("_filtChildrenDirty", true);

    //update actorsmap
    var actor = node.exec("actor")
    ,   actorsMap = this.slot("_actorsMap");

    if (actor)
      actorsMap[actor.identifier] = node;
  },

  addActor:function(a, pa)
  {
    var path;
    if (pa == undefined)
    {
      path = this.slot("_root");
    }
    else
      path = this.slot("_actorsMap")[pa.identifier];

    debug.assert(path, "parameter error in addActor");

    var node = this.exec("createNode", {actor:a});

    return this.exec("addNode", node, path);
  },
  
  createNode:function(param)
  {
    return NTreeNode.create(param);
  },

  removeNode:function(node)
  {
    //update actorsmap
    if (node.exec("actor"))
    {
      delete this.slot("_actorsMap")[node.exec("actor").identifier];

      debug.assert(this.slot("_actorsMap")[node.exec("actor").identifier] == undefined, "logical error");
    }

    if (node.exec("parent"))
      return node.exec("parent").exec("removeChild", node);
    else if (node && node == this.slot("_root"))
    {
      var oldOne = this.slot("_root");
      var root = NTreeNode.create({scene:this});
      this.slot("_root", root);
      return oldOne;
    }
  },

  removeActor:function(actor)
  {
    var node = this.slot("_actorsMap")[actor.identifier];
    if (node)
      return this.exec("removeNode", node);
  },
  
  // contianer must have push method
  filt:function(container, filter)
  {
    return this.slot("_root").exec("serializeChildren", container, filter);
  },
  
});

var TreeScene = Scene.extend([treeSceneTrait]);



exports.TreeScene = TreeScene;

}};