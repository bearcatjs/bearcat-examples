
__resources__["/__builtin__/util.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
//enable distinguish object primitively
(function()
{
  var __idGenter = 0;

  function object_id_getter()
  {
    if (this.hasOwnProperty("__identifier"))
    {
      return this.__identifier;
    }
    else
    {
      var newId = __idGenter++;
      Object.defineProperty(this, '__identifier', {value:newId});
      return newId;
    }
  }

  Object.defineProperty(Object.prototype, 'identifier', {get:object_id_getter, configurable:true,});
  
  /*
  Object.prototype.toString = (function(){
    var oriToString = Object.prototype.toString;
    
    return function()
    {
      return '[' + oriToString.call(this) + ' id:' + this.identifier  + ']';
    };
  })();
  */
})();

var util = {
  extend: function(target, ext){
    if (arguments.length < 2)
      throw "at least 2 params provide to extend"

    var i, obj;
    for (i=1; i<arguments.length; i++){
      obj = arguments[i]
      if (!obj)
        continue;

      var key, val;
      for (key in obj){
        if (!obj.hasOwnProperty(key))
          continue;

        val = obj[key]
        if (val === undefined || val === target)
          continue;

        target[key] = val
      }
    }

    return target;
  },

  beget: function(o){
    var F = function(){}
    F.prototype = o
    return new F();
  },
  
  each: function(obj, callback){
    if (typeof(obj) == 'array'){
      var i = 0,
        len = obj.length;
      
      for (; i<len; i++){
        callback(obj[i], i);
      }
    }
    else{
      var key;
      for (key in obj){
        if (obj.hasOwnProperty(key))
          callback(obj[key], key); 
      } 
    }
  },
  
  callback: function(target, method){
    if (typeof(method) == 'string'){
      method = target[method];
    }
    
    if (typeof(method) == 'function'){
      return function(){
        method.apply(target, arguments);
      }
    }
    else{
      debug.log("cannot create callback!!!"); 
    }
  },
  
  copy: function(obj) {
    if (obj === null) {
      return null;
    }
    else if(obj === undefined)
      return undefined;

    var copy;

    if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        //copy[i] = arguments.callee(obj[i]);
        //Node: strict mode do not allow arguments.callee
        copy[i] = util.copy(obj[i]);
      }
    } 
    else if (typeof(obj) == 'object') {
      if (typeof(obj.copy) == 'function') {
        copy = obj.copy();
      }
      else{
        copy = {};
        var o, x;
        for (x in obj) {
          //Node: strict mode do not allow arguments.callee
          copy[x] = util.copy(obj[x]);
          //copy[x] = arguments.callee(obj[x]);
        }
      }
    } 
    else {
      // Primative type. Doesn't need copying
      copy = obj;
    }

    return copy;
  },
};

var ArrayIterator = function(array)
{
  this._array = array;
  this._curIdx = 0;
};

var IteratorEnd = {};

util.extend(ArrayIterator.prototype, {
  next:function()
  {
    if (this._curIdx != this._array.length)
      this._curIdx ++;
  },
  
  prev:function()
  {
    if (this._curIdx != 0)
      this._curIdx --;
  },
  
  get:function()
  {
    if (this._curIdx == this._array.length)
      return IteratorEnd;
    else
      return this._array[this._curIdx];
  },
  
  end:function()
  {
    return this._curIdx == this._array.length;
  },
});


var it = function()
{
  return new ArrayIterator(this);
};

Object.defineProperty(Array.prototype,
                      "iterator",
                      {
                        get: function () { return it;},
                        set: function (v) { },
                        enumerable: false
                      });


if (!Object.freeze)
{
  Object.freeze = function(x){return x;};
}

/*
  add functional util reduce/map/forEach/some/filter to hashtable
*/

/*
 * NodeList 不是一个数组，所以map等会调用到这里来。但是NodeList的length是enumerable，能被检索到。 如果在cb中删除nodelist中某一项，nodelist会同步更新，原来的第n项，之后会变成n-1
 * NodeList 不要使用这里的map和reduce等。
*/

var notSpecifiedValue = {};
//cb signatrue  (previousValue, currentValue, key, object) --> anything
var reduce = function(cb, initialValue)
{
  var previousValue = arguments.length == 2 ? initialValue : notSpecifiedValue;

  var keys = Object.keys(this);
  if (keys.length == 0)
    return {};
  
  var curIdx = 0;
  
  if (previousValue == notSpecifiedValue)
  {
    previousValue = this(keys[0]);
    curIdx = 1;
  }

  while (curIdx < keys.length)
  {
    previousValue = cb(previousValue, this[keys[curIdx]], keys[curIdx], this);
    curIdx ++;
  }

  return previousValue;
};

Object.defineProperty(Object.prototype, 
                      "reduce", 
                      {
                        value:reduce,
                        enumerable:false,
                        writable:true
                      });

var map = function(cb)
{
  return this.reduce(function(prev, cur, key, obj)
                     {
                       prev[key] = cb(cur, key, obj);
                       return prev;
                     },
                     {});
};

Object.defineProperty(Object.prototype,
                      "map",
                      {
                        value:map,
                        enumerable:false,
                        writable:true
                      });

var filter = function(cb)
{
  return this.reduce(function(prev, cur, key, obj)
                     {
                       if (cb(cur, key, obj))
                       {
                         prev[key] = cur;
                       }

                       return prev;
                     },
                     {});
};

Object.defineProperty(Object.prototype,
                      "filter",
                      {
                        value:filter,
                        enumerable:false,
                        writable:true
                      });

var forEach = function(cb)
{
  return this.reduce(function(prev, cur, key, obj)
                     {
                       cb(cur, key, obj);
                     },
                     undefined);
};

Object.defineProperty(Object.prototype,
                      "forEach",
                      {
                        value:forEach,
                        enumerable:false,
                        writable:true
                      });

var some = function(cb)
{
  var keys = Object.keys(this);
  var i = 0;
  while (i < keys.length)
  {
    if (cb(this[keys[i]], keys[i], this))
      return true;
    
    i++;
  }

  return false;
};

Object.defineProperty(Object.prototype,
                      "some",
                      {
                        value:some,
                        enumerable:false,
                        writable:true
                      });

module.exports = util;



}};