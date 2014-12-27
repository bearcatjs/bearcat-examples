
__resources__["/__builtin__/transformable.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var geo = require("geometry")
,   util = require("util")
,   Klass = require("base").Klass
,   Trait = require("oo").Trait
,   assert = require("debug").assert

var transformableTrait = Trait.extend({
  initialize:function(timeStamp,dep)
  {
    assert(timeStamp, "param error");
    
    var m = [];
    m[0] = {
      x:0,
      y:0,
      z:0,
      sx:1,
      sy:1,
      r:0
    };

    //debugger;

    this.slot("__matrixs__", m);
    this.slot("__timeStamper__", timeStamp);
    this.slot("__curStamp__", timeStamp.exec("now"));
    this.slot("__lastStamp__", timeStamp.exec("now")-1);
    this.slot("__depTransformable__", dep);

    this.slot("__matrix__", this.exec("matrix"));
  },

  setX:function(val)
  {
    var m = this.slot("__matrixs__")[0];
    m.x = val;

    this.exec("__stepForwardTimeStamp__");
  },

  applyX:function(val)
  {
    var m = this.slot("__matrixs__")[0];
    m.x += val;

    this.exec("__stepForwardTimeStamp__");
  },

  setY:function(val)
  {
    var m = this.slot("__matrixs__")[0];
    m.y = val;
    this.exec("__stepForwardTimeStamp__");
  },

  applyY:function(val)
  {
    var m = this.slot("__matrixs__")[0];
    m.y += val;

    this.exec("__stepForwardTimeStamp__");
  },

  translate:function(x, y, z)
  {
    var m = this.slot("__matrixs__")[0];
    m.x = x;
    m.y = y;

    if (typeof(z) == "number")
      m.z = z;

    this.exec("__stepForwardTimeStamp__");
  },

  applyTranslate:function(x, y, z)
  {
    var m = this.slot("__matrixs__")[0];
    m.x += x;
    m.y += y;

    if (typeof(z) == "number")
      m.z += z;

    this.exec("__stepForwardTimeStamp__");
  },

  rotate:function(radian)
  {
    var m = this.slot("__matrixs__")[0];
    m.r = radian;
    this.exec("__stepForwardTimeStamp__");
  },

  applyRotate:function(radian)
  {
    var m = this.slot("__matrixs__")[0];
    m.r += radian;
    this.exec("__stepForwardTimeStamp__");
  },

  scaleX:function(sx)
  {
    var m = this.slot("__matrixs__")[0];
    m.sx = sx;
    this.exec("__stepForwardTimeStamp__");
  },

  applyScaleX:function(sx)
  {
    var m = this.slot("__matrixs__")[0];
    m.sx += sx;
    this.exec("__stepForwardTimeStamp__");
  },

  scaleY:function(sy)
  {
    var m = this.slot("__matrixs__")[0];
    m.sy = sy;
    this.exec("__stepForwardTimeStamp__");
  },
  
  applyScaleY:function(sy)
  {
    var m = this.slot("__matrixs__")[0];
    m.sy += sy;
    this.exec("__stepForwardTimeStamp__");
  },

  scale:function(sx, sy)
  {
    var m = this.slot("__matrixs__")[0];
    m.sx = sx;
    m.sy = sy;
    this.exec("__stepForwardTimeStamp__");
  },

  applyScale:function(sx, sy)
  {
    var m = this.slot("__matrixs__")[0];
    m.sx += sx;
    m.sy += sy;
    this.exec("__stepForwardTimeStamp__");
  },

  affineTransform:function(m)
  {
    var affine = geo.decomposeMatrix(m);
    var m = this.slot("__matrixs__")[0];
    
    m.x = affine.x;
    m.y = affine.y;
    m.sx = affine.sx;
    m.sy = affine.sy;
    m.r = affine.r;

    this.exec("__stepForwardTimeStamp__");
  },

  pushTransform:function()
  {
    var ms = this.slot("__matrixs__");
    var m = Array.prototype.slice.call(arguments);

    ms.push(m);
    this.exec("__stepForwardTimeStamp__");
  },

  popTransform:function()
  {
    var ms = this.slot("__matrixs__");

    assert(ms.length > 1, "logical error");

    this.exec("__stepForwardTimeStamp__");
    return ms.pop();
  },

  getTransformSteps:function()
  {
    var ms = this.slot("__matrixs__");

    var steps = [
      ["translate", ms[0].x, ms[0].y, ms[0].z],
      ["scale", ms[0].sx, ms[0].sy],
      ["rotate", ms[0].r]
    ];

    return steps.concat(ms.slice(1));
  },

  __rotatematrix:function(m, r)
  {
    return geo.matrixRotateBy(m, r);
  },

  __scalematrix:function(m, sx, sy)
  {
    return geo.matrixScaleBy(m, sx, sy);
  },

  __translatematrix:function(m, x, y, z)
  {
    return geo.matrixTranslateBy(m, x, y, z);
  },

  __matrixmatrix:function(m, m1)
  {
    return geo.matrixMultBy(m, m1);
  },

  matrix:function()
  {
    if (this.exec("__transformable_dirty__"))
    {
      var dep = this.slot("__depTransformable__");
      var matrix = dep ? util.copy(dep.exec("matrix")) : geo.identityMatrix();
      var ms = this.slot("__matrixs__");
      var affine = ms[0];

      if (affine.x != 0 || affine.y != 0 || affine.z != 0)
        geo.matrixTranslateBy(matrix, affine.x, affine.y, affine.z);
      
      if (affine.sx != 1 || affine.sy != 1)
        geo.matrixScaleBy(matrix, affine.sx, affine.sy);

      if (affine.r != 0)
        geo.matrixRotateBy(matrix, affine.r);

      for (var i=1; i<ms.length; i++)
      {
        this.exec.apply(this, ["__" + ms[i][0] + "matrix", matrix].concat(ms[i].slice(1)));
      }

      this.slot("__lastStamp__", this.slot("__timeStamper__").exec("now"));

      this.slot("__matrix__", matrix);
      return matrix;
    }
    else
      return this.slot("__matrix__");
  },

  setDepTransformable:function(dep)
  {
    var oldOne = this.slot("__depTransformable__");

    this.slot("__depTransformable__", dep);
    this.exec("__stepForwardTimeStamp__");

    return oldOne;
  },

  stamp:function()
  {
    return this.slot("__lastStamp__");
  },

  __transformable_dirty__:function()
  {
    var dep = this.slot("__depTransformable__");

    //1, self dirty
    //2, dep  dirty
    //3, dep is newer than self

    if (this.slot("__lastStamp__") == this.slot("__timeStamper__").exec("now"))
      return false;

    var bDirty = (this.slot("__lastStamp__") < this.slot("__curStamp__") ||
                  dep && dep.exec("__transformable_dirty__") ||
                  dep && this.exec("stamp") < dep.exec("stamp"));
    
    if (!bDirty)
    {
      this.slot("__lastStamp__", this.slot("__timeStamper__").exec("now"));
      this.slot("__curStamp__", this.slot("__lastStamp__"));
    }
    
    return bDirty;
  },

  __stepForwardTimeStamp__:function()
  {
    this.slot("__timeStamper__").exec("stepForward");
    this.slot("__curStamp__", this.slot("__timeStamper__").exec("now"));
  },
});

exports.transformableTrait = transformableTrait;

}};