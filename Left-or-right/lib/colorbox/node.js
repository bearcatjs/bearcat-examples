
__resources__["/__builtin__/node.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var Klass = require("base").Klass
,   Trait = require("oo").Trait
,   animatorTrait = require("actortraits").animatorTrait
,   transformableTrait = require("transformable").transformableTrait
,   eventHandleTrait = require("actortraits").eventHandleTrait
,   debug = require("debug")

/**
 * @iclass[Node Object]{
 *   精灵对象。
 * }
 */

/**
 * @constructor[Node]{
     @param[(type undefined)]{
        精灵类型
     }

 *   @return{
 *    @para{alsjfdalf}
 *    精灵实例
 * }
 * 
 *   精灵构造函数。 safd asdf 
 *   
  * }
 */
  
/**
 *  @method[test]{
      @class[Node]
 *    @param[(p1 v1)]{
 *     参数p1.用来干啥干啥干啥...
 *    }
 * 
 *    @param[p2]{
 *     参数p2. 类型:String
 *     blabla...
 *    
 *     @para{aslkjfakjsfdal;jsfajfja;lkf}
 *    }
 *    
 *    @param[p3 varargs]{
 *     可变参数，随便你。
 *    }
 *    @para{aslfdjal;fd}
 *    al;skdfja;lkfj 
 *    asd jlkajf 
 * 
 *    a dsfkl;fj 
 *    @return{
 *     askjfaj;f 
 *     adfj laf; kla
 *    }
 *  }
 */  

/**
 *  @function[type]{
 *   获取精灵type属性。
 *  }
*/

/**
 *  @method[addComponent]{
 *    为精灵添加一个新的component
      @para{zhangping}
 *    
 *    @class[Node]
 *
 *    @param[type]{
 *       component名称。
 *    }
 * 
 *    @param[component]{
 *       component对象。
 *    }
 *  }
 */ 

//FIXME: scene需要调整下
var actorTrait = Trait.extend({
  initialize:function(param)
  {
    param = param ? param : {};

    this.execProto("initialize");

    this.slot("_satelliteData", {});
    this.slot("_updates", []);

    this.slot("_scene", param.scene);
    
    this.slot("_model", param.model);
    
    this.slot("_type", param.type);
    
    this.exec("animatorInitialize");
    this.exec("transformableInitialize", require('director').timeStamp);

    this.exec("eventHandleInitialize", param);

    return this;
  },

  type:function()
  {
    return this.slot("_type");
  },

  model:function()
  {
    return this.slot("_model");
  },

  setModel:function(model)
  {
    var oldOne = this.slot("_model");
    this.slot("_model", model);
    return oldOne;
  },
  
  emmitModels:function(v)
  {
    v.push([this.exec("model"), {matrix:this.exec("matrix")}]);
    return v;
  },

  // useActorMatrix:function(v)
  // {
  //   v.forEach(function(mp)
  //             {
  //               mp[1].matrix = geo.
  //             });
  // },
                       
  //FIXME: scene的处理貌似不是很妥当。在构造actor的时候可能不知道scene，每个actor都保存scene信息又显得多余，维护起来也麻烦。
  getScene:function()
  {
    return this.slot("_scene");
  },

  setScene:function(s)
  {
    var oldS = this.exec("getScene");
    this.slot("_scene", s);
    return oldS;
  },
  
  //这里应该增加参数scene
  onEntered:function()
  {
  },
  
  onExit:function()
  {
  },
  
  regUpdate: function(update)
  {
    debug.assert(-1 == this.slot("_updates").indexOf(update), "logical error");

    this.slot("_updates").push(update);
  },

  unRegUpdate:function(update)
  {
    debug.assert(-1 != this.slot("_updates").indexOf(update), "logical error");
    
    var updates = this.slot("_updates");

    updates.splice(updates.indexOf(update), 1);
  },

  update:function(t)
  {
    this.slot("_updates").forEach(function(u)
                                  {
                                    u.call(undefined, t, this);
                                  },
                                  this);
  },

  querySatelliteData:function(sname, initVal)
  {
    debug.assert(!this.slot("_satelliteData").hasOwnProperty(sname), "cannot query satellite data:" + sname);

    this.slot("_satelliteData")[sname] = initVal;

    return initVal;
  },

  satelliteData:function(sname, val)
  {
    if (arguments.length == 1)
    {
      return this.slot("_satelliteData")[sname];
    }
    else
    {
      this.slot("_satelliteData")[sname] = val;
      return val;
    }
  },

});

var Actor = Klass.extend([
  actorTrait, 
  animatorTrait.rename({initialize:"animatorInitialize"}),
  transformableTrait.rename({initialize:"transformableInitialize"}),
  eventHandleTrait.rename({initialize:"eventHandleInitialize"})]);


var NtreeNodeTrait = Trait.extend({
  initialize:function(param)
  {
    this.execProto("initialize", param);

    this.slot("_parent", undefined);

    var children = [];

    this.slot("_children", children);

    if (param.children)
      param.children.forEach(function(c)
                             {
                               children.push(c);
                             });

    this.slot("_actor", param.actor);
    this.slot("_isInScene", false);
  },

  parent:function()
  {
    return this.slot("_parent");
  },

  actor:function()
  {
    return this.slot("_actor");
  },
  
  children:function()
  {
    return this.slot("_children");
  },

  appendChild: function(child)
  {
    debug.assert(NTreeNode.isPrototypeOf(child), "parameter error");

    if (child.slot("_parent"))
    {
      child.slot("_parent").exec("removeChild", child);
    }
    
    this.slot("_children").push(child);
    child.slot("_parent",  this);
    
    child.slot("_isInScene", this.slot("_isInScene"));
    
    //update actor's deptransformable
    if (!child.slot("_actor"))
    {
      return;
    }

    var getDepActor = function(node)
    {
      if (!node)
        return;

      var actor = node.slot("_actor");
      if (actor)
        return actor;

      //return arguments.callee(node.slot("_parent"));
      return getDepActor(node.slot("_parent"));
    };
    var depActor = getDepActor(this);

    if (depActor)
      child.slot("_actor").exec("setDepTransformable", depActor);
     
     //fixme: 并没有通知child的所有的孩子
    if (this.slot("_isInScene") == true)
      child.slot("_actor").exec("onEntered");
  },
  
  removeChild: function(child)
  {
    debug.assert(NTreeNode.isPrototypeOf(child), "parameter error");

    var idx = this.slot("_children").indexOf(child);
    
    debug.assert(idx != -1, "logical error, You remove an unexist child");
    
    var childActor = child.slot("_actor");
    if (childActor)
     {
        //fixme:并没有通知child的所有的孩子
      if (child.slot("_isInScene") == true)
        childActor.exec("onExit");

      childActor.exec("setDepTransformable", null);
    }

    child.slot("_parent", null);
    this.slot("_children").splice(idx, 1);
    child.slot("_isInScene", false);
  },
  
  traverse: function(f)
  {
    var children = this.exec("children");
    if (this.slot("_actor"))
      f(this.slot("_actor"));
    
    children.forEach(function(child, i)
                     {
                       child.exec("traverse", f);
                     });
  },

  //FIXME: 这里得到的是actor，而actor完全不知道他所属的那个node，这也就是完全丧失了对node的控制能力。
  serializeChildren:function(arr, filter)
  {
    if (!filter)
    {
      this.exec("traverse", function (actor)
                {
                  arr.push(actor);
                });
    }
    else
    {
      this.exec("traverse", function (actor)
                {
                  if (filter(actor))
                    arr.push(actor);
                });
    }
    return arr;
  }
});

var NTreeNode = Klass.extend([NtreeNodeTrait]);

exports.Actor = Actor;
exports.NTreeNode = NTreeNode;

}};