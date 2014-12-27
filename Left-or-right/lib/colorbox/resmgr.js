
__resources__["/__builtin__/resmgr.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var h = require("helper")
   ,Klass = require("base").Klass
   ,Trait = require("oo").Trait;


var resMgrTrait = Trait.extend({
  initialize:function()
  {
    this.execProto("initialize");
    
    this.slot("_res", {});
    this.slot("_resNum", 0);
    this.slot("_loadedNum", 0);
  },
  
  _genResOnloadCB:function(mgr, name)
  {
    return function()
    {
      if (mgr.slot("_res")[name])
        mgr.slot("_loadedNum", mgr.slot("_loadedNum") + 1);
    }
  },
  
  loadImage:function(img)
  {
    var res = this.slot("_res")[img];

    if (res)
      return res;

    //FIXME:when img load failed??
    this.slot("_res")[img] = h.loadImage(img, undefined, this.exec("_genResOnloadCB", this, img));
    this.slot("_resNum", this.slot("_resNum")+1);

    return this.slot("_res")[img];
  },
  
  removeRes:function(name)
  {
    if (this.slot("_res")[name])
    {
      this.slot("_resNum", this.slot("_resNum")-1);
      if (this.slot("_res")[name].loaded)
        this.slot("_loadedNum", this.slot("_loadedNum")-1);

      delete this.slot("_res")[name];
      return true;
    }

    return false;
  },
  
  queryRes:function(name)
  {
    return this.slot("_res")[name];
  },

  isCompelete:function()
  {
    return this.slot("_resNum") <= this.slot("_loadedNum");
  },

  percent:function()
  {
    return this.slot("_loadedNum") / this.slot("_resNum");
  },
  
});

var ResMgr = Klass.extend([resMgrTrait]);


exports.ResMgr = ResMgr;

}};