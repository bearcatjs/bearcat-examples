
__resources__["/__builtin__/base.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var util = require("util");

/*------------------------------------------------------------------------------------------*/
var Entity = require("oo").Entity
,   Trait = require("oo").Trait
,   extendObjectByTrait = require("oo").extendObjectByTrait;

var Klass = Entity.clone(
  [], 
  {
    initialize:function()
    {
      //do nothing
    },
  }, 
  function(){
    this.create = function(){
      var args = Array.prototype.slice.call(arguments, 0)
      ,   inst = this.clone([]);

      args.splice(0, 0, "initialize");

      inst.exec.apply(inst, args);

      //make sure instance cannot call create and extend!
      inst.create = undefined;
      inst.extend = undefined;

      inst.class = this;

      return inst;
    };  
    
    this.extend = function(traits, extMethods, custom)
    {
      traits = traits ? traits : [];

      var cls = this.clone(traits, extMethods);
      cls.superClass = this;

      if (custom)
      {
        var args = Array.prototype.slice.call(arguments, 3);
        custom.apply(cls, args);
      }

      return cls;
    };
});

exports.Klass = Klass;
exports.extendObjectByTrait = extendObjectByTrait;
/*--------------------------------------for test--------------------------------------*/
/*
var K1 = Klass.extend(undefined,
                      {
                        initialize:function(a, b, c)
                        {
                          this.execProto("initialize");

                          console.log("initialize K1, a:"+a + " b:"+ b + " c:" + c);
                          
                          this.a = 0;
                        },

                        foo:function()
                        {
                          console.log("call K1 foo");
                        },
                      });
var k1 = K1.create(1, 23, 3);
k1.exec("foo");

k1.a = 3;

var kk1 = K1.create(1, 23, 3);
kk1.exec("foo");

var K2 = K1.extend(undefined,
                   {
                     initialize:function(t)
                     {
                       this.execProto("initialize", 1, 2, 3);
                       console.log("call K1 initialize:"+ t);
                     },

                     foo:function()
                     {
                       this.execProto("foo");
                       console.log("call K2 foo");
                     }
                   }
                  );
var k2 = K2.create(100);
k2.exec("foo");
*/

}};