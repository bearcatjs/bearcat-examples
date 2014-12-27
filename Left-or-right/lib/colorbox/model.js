
__resources__["/__builtin__/model.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var Trait = require("oo").Trait
,   Klass = require("base").Klass
,   helper = require("helper")
,   debug = require("debug")
,   geo = require("geometry")
,   util = require("util")

var Model = Klass.extend(undefined,
                         {
                           initialize:function(param)
                           {
                             this.execProto("initialize");

                             this.slot("cache", {});
                             
                             Object.keys(param).forEach(function(key){
                               this.slot(key, param[key]);
                             },
                                                        this);

                             if (param.type == undefined)
                               this.slot("type", "model");
                           },
                           get:function(key)
                           {
                             return this.slot(key);
                           },

                           set:function(key, val)
                           {
                             this.slot("cache", {});

                             return this.slot(key, val);
                           },

                           copy:function()
                           {
                             return this;
                           },
                         },

                         function()
                         {
                           this.slot = function(key, val)
                           {
                             if (arguments.length == 2)
                               Model.superClass.slot.call(this, "cache", {});

                             //必须使用apply来保存arguments.length信息。
                             return Model.superClass.slot.apply(this, Array.prototype.slice.call(arguments, 0));
                           };
                         });

var CircleModel = Model.extend(undefined,
                               {
                                 initialize:function(param)
                                 {
                                   this.execProto("initialize", param);

                                   if (param.radius == undefined)
                                     this.slot("radius", 0);

                                   if (param.fill == undefined)
                                     this.slot("fill", "rgba(255, 255, 255, 255)");
                                   
                                   // if (param.stroke == undefined)
                                   //   this.slot("stroke", {r:255, g:255, b:0, a: 255});

                                   this.slot("type", "circle");
                                 },
                               });

var ConvexModel = Model.extend(undefined,
                               {
                                 initialize:function(param)
                                 {
                                   this.execProto("initialize", param);

                                   if (param.vertexes == undefined)
                                     this.slot("vertexes", []);

                                   if (param.fill == undefined)
                                     this.slot("fill", "rgba(255, 255, 255, 255)");

                                   // if (param.stroke == undefined)
                                   //   this.slot("stroke", {r:255, g:255, b:0, a: 255});

                                   this.slot("type", "convex");
                                 },
                               });

/*
  line style:
  lineWidth
  lineCap
  lineJoin
  miterLimit
  context . setLineDash(segments)
*/

var setLineStyle = function(ctx, m)
{
  if (m.slot("lineWidth") != undefined)
    ctx.lineWidth = m.slot("lineWidth");
  
  if (m.slot("lineCap") != undefined)
    ctx.lineCap = m.slot("lineCap");

  if (m.slot("lineJoin") != undefined)
    ctx.lineJoin = m.slot("lineJoin");
  
  if (m.slot("miterLimit") != undefined)
    ctx.miterLimit = m.slot("miterLimit");

  if (m.slot("lineDash") != undefined)
    ctx.setLineDash(m.slot("lineDash"));

  if (m.slot("lineDashOffset") != undefined)
    ctx.lineDashOffset = m.slot("lineDashOffset");

  if (m.slot("strokeStyle") != undefined)
    ctx.strokeStyle = m.slot("strokeStyle");
}

var LineModel = Model.extend(undefined,
                             {
                               initialize:function(param)
                               {
                                 this.execProto("initialize", param);
                                 
                                 /*
                                   m --> moveTo(x, y)
                                   l --> lineTo(x, y) ...
                                  */
                                 this.slot("type", "line");
                               },
                             });

var drawLineModel = function(model, painter)
{
  var ctx = painter.exec("sketchpad");
  
  ctx.save();
  
  setLineStyle(ctx, model);

  var m = model.slot("m");
  var ls = model.slot("l");

  ctx.beginPath();
  ctx.moveTo(m.x, m.y);
  ls.forEach(function(l)
             {
               ctx.lineTo(l.x, l.y);
             });
  ctx.stroke();

  ctx.restore();
};

var getBBoxByPstns = function(pstns)
{
  var xmin, xmax, ymin, ymax;
  
  pstns.forEach(function(pstn)
                {
                  if (pstn.x < xmin || xmin == undefined)
                    xmin = pstn.x;
                  if (pstn.x > xmax || xmax == undefined)
                    xmax = pstn.x;

                  if (pstn.y < ymin || ymin == undefined)
                    ymin = pstn.y;
                  if (pstn.y > ymax || ymax == undefined)
                    ymax = pstn.y;
                });

  return new geo.Rect(xmin, ymin, xmax-xmin, ymax-ymin);
};

var bboxOfLineModel = function(m, painter)
{
  var pstns = [m.slot("m")];
  
  m.slot("l").forEach(function(l)
                       {
                         pstns.push(l);
                       });

  return getBBoxByPstns(pstns);
};

var lineHittest = function(m, x, y, painter)
{
  var isPointInLine = function(p1, p2, x, y, lineWidth)
  {
    //vector为 p1-p2.  首先得到x，y相对于p1-p2为x轴的坐标系下的点
    var matrix = geo.identityMatrix();
    var angle = geo.getVectorAngle({x:1, y:0}, geo.ccpSub(p1, p2));

    matrix = geo.matrixRotateBy(matrix, -angle);
    matrix = geo.matrixTranslateBy(matrix, -p2.x, -p2.y);
    
    var localPstn = geo.pointApplyMatrix({x:x, y:y}, matrix);

    var newp1 = geo.pointApplyMatrix(p1, matrix);
    
    return geo.rectContainsPoint(new geo.Rect(0, -lineWidth/2, newp1.x, lineWidth), localPstn);
  };

  var lineWidth = m.slot("lineWidth");
  if (undefined == lineWidth)
    lineWidth = painter.exec("sketchpad").lineWidth;

  var pstns = [m.slot("m")];
 
  m.slot("l").forEach(function(l)
                      {
                        pstns.push(l);
                      });
  
  return pstns.some(function(p, i)
                    {
                      if (i == 0)
                        return false;
                      
                      return isPointInLine(pstns[i-1], pstns[i], x, y, lineWidth);
                    });
};

require('painter').HonestPainter.register('line', {bbox:bboxOfLineModel, draw:drawLineModel, inside:lineHittest});

var ArcModel = Model.extend(undefined,
                             {
                               initialize:function(param)
                               {
                                 this.execProto("initialize", param);
                                 
                                 /*
                                   x, y, radius, startAngle, endAngle, [anticlockwise=false]
                                  */
                                 debug.assert(param.radius != undefined && param.startAngle != undefined && param.endAngle!=undefined, "parameter error");
                                 
                                 if (param.anticlockwise != undefined)
                                   this.slot("anticlockwise", param.anticlockwise);
                                 else
                                   this.slot("anticlockwise", false);

                                 this.slot("type", "arc");
                               }
                             });

var drawArcModel = function(m, painter)
{
  var ctx = painter.exec("sketchpad");
  
  ctx.save();

  setLineStyle(ctx, m);
  
  ctx.beginPath();
  ctx.arc(0, 0, m.slot("radius"), m.slot("startAngle"), m.slot("endAngle"), m.slot("anticlockwise"));
  ctx.stroke();

  ctx.restore();
};

var bboxOfArc = function(m, painter)
{
  var x = m.slot("x")
  ,   y = m.slot("y")
  ,   radius = m.slot("radius");

  return new geo.Rect(x - radius, y - radius, 2*radius, 2*radius);
};

var arcHittest = function(m, x, y, painter)
{
  //arc绘制算法：从startAngle开始，按照顺时钟方向画到endAngle的角度。 如果两个角度相差2PI，那么就是一个整圆了。
  var startAngle = m.slot("startAngle");
  var endAngle = m.slot("endAngle");
  var radius = m.slot("radius");
  var lineWidth = m.slot("lineWidth");
  if (undefined == lineWidth)
    lineWidth = painter.exec("sketchpad").lineWidth;

  var r = Math.sqrt(x*x, y*y);
  //判断点是否在圆环内
  var isInTorus = (radius - lineWidth/2) <= r && r <= (radius + lineWidth/2);
  if (!isInTorus)
    return false;
  
  if (2 * Math.PI <= endAngle - startAngle || endAngle - startAngle <= -2 * Math.PI)
  {
    //画了一个整圆
    return true;
  }

  //得到向量(x, y)和startAngle半径之间的夹角
  var startX = radius * Math.cos(startAngle);
  var startY = radius * Math.sin(startAngle);

  //这个时候是等价的
  var angle = geo.getVectorAngle({x:startX, y:startY}, {x:x, y:y}) + startAngle;
  if (endAngle < startAngle)
    endAngle+=Math.PI*2;
  
  return angle >= startAngle && angle <= endAngle;
};

require('painter').HonestPainter.register('arc', {bbox:bboxOfArc, draw:drawArcModel, inside:arcHittest});

var TextModel = Model.extend(undefined,
                             {
                               initialize:function(param)
                               {
                                 this.execProto("initialize", param);
                                 
                                 if (param.text == undefined)
                                   this.slot("text", "");
                                 
                                 if (param.height == undefined)
                                   this.slot("height", 18);

                                 if (param.font == undefined)
                                   this.slot("font", "Arial");

                                 if (param.fill == undefined)
                                   this.slot("fill", "rgba(255, 255, 255, 255)");

                                 // if (param.stroke == undefined)
                                 //   this.slot("stroke", {r:255, g:255, b:0, a: 255});

                                 this.slot("type", "text");
                               },
                             });

var defaultWidthForUnloaded = 100;
var defaultHeightForUnloaded = 100;

var ImageModel = Model.extend(undefined,
                              {
                                initialize:function(param)
                                {
                                  this.execProto("initialize", param);
                                  
                                  if (param.image == undefined)
                                    this.slot("image", helper.loadImage(""));

                                  // if (param.width == undefined)
                                  //   this.slot("width", 1);
                                  
                                  // if (param.height == undefined)
                                  //   this.slot("height", 1);

                                  if (param.fill == undefined)
                                    this.slot("fill", "rgba(255, 255, 255, 255)");

                                  // if (param.stroke == undefined)
                                  //   this.slot("stroke", {r:255, g:0, b:0, a:255});
                                    
                                  if(param.alpha == undefined)
                                    this.slot("alpha", 1);

                                  this.slot("type", "image");
                                },
                              },
                              
                              function()
                              {
                                this.slot = function(key, val)
                                {
                                  if (key == "width" || key == "height")
                                  {
                                    if (arguments.length == 1)
                                    {
                                      var img = this.slot("image");
                                      if (img.loaded)
                                        return img[key];
                                      else
                                        return key == "width" ? defaultWidthForUnloaded : defaultHeightForUnloaded;
                                    }
                                    else
                                    {
                                      debug.warning("cannot set image property");
                                      return;
                                    }
                                  }

                                  return ImageModel.superClass.slot.apply(this, Array.prototype.slice.call(arguments, 0));
                                };
                              });

var MapModel = Model.extend(
   undefined,
   {
      initialize:function(param)
      {
        var buildMap = require('tiled_map').buildMap;
         this.execProto("initialize", param);

         this.slot("type", "map");

         if (param.resource == undefined){
            debug.error('MapModel constructor: param error');
            return;
         }

        //FIXME: async map resource
         this.slot("map", buildMap(param.resource));
         
         if (undefined != param.shelterAlpha)
            this.slot("shelterAlpha", param.shelterAlpha);
         else
            this.slot("shelterAlpha", 0.5);
         
         var self = this;
         
         if (undefined != param.shelterModelMaper)
            this.slot("shelterModelMaper", param.shelterModelMaper);
         else
            this.slot("shelterModelMaper", 
                      function(model){
                         return BuildingModel(self.shelterAlpha, model);
                      });
         
         this.slot("map").
            getThingMatters().
            forEach(function(matter)
                    {
                      self.exec("_createMatterBasicModel", matter);
                       //create basic model
                      // var tile = self.slot("map").getTileByGlobalId(matter.getTileGlobalId());
                      //  var tileset = tile.getTileset();
                       
                      //  var model = ClipModel.create(
                      //     {
                      //        model:ImageModel.create({image:tileset.getImage().getDocImage()}),
                      //        x:tile.getImageRectPositionX(),
                      //        y:tile.getImageRectPositionY(),
                      //        w:tileset.getProperty("tilewidth"),
                      //        h:tileset.getProperty("tileheight")
                      //     });
                       
                      //  var mat={a:1, 
                      //           b:0, 
                      //           c:0, 
                      //           d:1, 
                      //           tx:tile.getDrawPositionByRowCol(matter.getRow(), matter.getCol()).x, 
                      //           ty:tile.getDrawPositionByRowCol(matter.getRow(), matter.getCol()).y};
                       
                      //  // matter.getUserData 第一次如果使用getUserData返回undefined，汗颜！！！
                      //  var data = matter.getUserData();
                      //  if (data == undefined)
                      //     data = {};
                      // data.basicModel = self.slot("shelterModelMaper")(model);
                      //  data.basicModel.mat = mat;
                      //  matter.setUserData(data);
                    },
                    this);

      },

     _createMatterBasicModel:function(matter)
     {
       var tile = this.slot("map").getTileByGlobalId(matter.getTileGlobalId());
       var tileset = tile.getTileset();
       
       var model = ClipModel.create(
         {
           model:ImageModel.create({image:tileset.getImage().getDocImage()}),
           x:tile.getImageRectPositionX(),
           y:tile.getImageRectPositionY(),
           w:tileset.getProperty("tilewidth"),
           h:tileset.getProperty("tileheight")
         });
       
       var mat={a:1, 
                b:0, 
                c:0, 
                d:1, 
                tx:tile.getDrawPositionByRowCol(matter.getRow(), matter.getCol()).x, 
                ty:tile.getDrawPositionByRowCol(matter.getRow(), matter.getCol()).y};
       
       // matter.getUserData 第一次如果使用getUserData返回undefined，汗颜！！！
       var data = matter.getUserData();
       if (data == undefined)
         data = {};
       data.basicModel = this.slot("shelterModelMaper")(model);
       data.basicModel.mat = mat;
       matter.setUserData(data);
     },

     removeThingMatter:function(matter)
     {
       return this.slot("map").removeThingMatter(matter);
     },

     addThingMatterEx:function(name, x, y)
     {
       var matter = this.slot("map").addThingMatterEx(name, x, y);
       this.exec("_createMatterBasicModel", matter);
       return matter;
     },

     addThingMatter:function(name, row, col)
     {
       var matter = this.slot("map").addThingMatterEx(name, row, col);
       this.exec("_createMatterBasicModel", matter);
       return matter;
     }
   });


var ClipModel = Model.extend(undefined,
                             {
                               initialize:function(param)
                               {
                                 this.execProto("initialize", param);
                                 
                                 this.slot("type", "clip");

                                 if (param.x == undefined)
                                   this.slot("x", 0);
                                 if (param.y == undefined)
                                   this.slot("y", 0);
                                 if (param.w == undefined)
                                   this.slot("w", 0);
                                 if (param.h == undefined)
                                   this.slot("h", 0);

                                 debug.assert(typeof(this.slot("x")) == 'number' &&
                                              typeof(this.slot("y")) == 'number' &&
                                              typeof(this.slot("w")) == 'number' &&
                                              typeof(this.slot("h")) == 'number' && 
                                              this.slot("model"), "ClipModel parameter error!");
                               },
                             });

function getClipModelBoundingBox(model, painter)
{
  // 应该是基于本地坐标系的
  return geo.rectMake(0, 0, model.slot("w"), model.slot("h"));
}

var viewClipModel = (function()
                     {
                       var offscreen_buffer;

                       return function(model, painter)
                       {
                         debug.assert(model.slot("type") == 'clip' && model.slot("model"), 'bad model');
                         
                         var pjs = painter.exec("sketchpad");

                         var octx = pjs;//pjs.externals.context;
                         //octx.save();
                         octx.beginPath();
                         octx.rect(0,0,model.slot("w"), model.slot("h"));
                         octx.clip();
                         octx.translate(-model.slot("x"), -model.slot("y"));

                         //painter.draw(model.model, offscreen_buffer);
                         painter.exec("draw", model.slot("model"));

                         //octx.restore();

                         //offscreen_buffer.popMatrix();

                         //offscreen_buffer.endDraw();

                         //pjs.imageEx(offscreen_buffer, 0, 0, model.w, model.h, 0, 0, model.w, model.h);

                         
                       };
                     })();

function clipModelInside(model, x, y, painter)
{
  // 相对于clip的本地坐标系
  return 0 <= x && x <= model.slot("w")
    && 0 <= y && y <= model.slot("h")
    && painter.exec("inside", model.slot("model"), 
                 {
                   x: x + model.slot("x"), 
                   y: y + model.slot("y")
                 },
                 painter);
}

require('painter').HonestPainter.register('clip', {bbox:getClipModelBoundingBox, draw:viewClipModel, inside:clipModelInside,});

var ProcedureModel = Model.extend(
  undefined,
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);
      this.slot("type", "ProcedureModel");

      if (param.draw == undefined)
        this.slot("draw", function(){});
      if (param.bbox == undefined)
        this.slot("bbox", function(){return geo.rectMake(0, 0, 0, 0);});
      if (param.inside == undefined)
        this.slot("inside", function(){return false;});
    },
  });

var getProcModelbbox = function(m, painter)
{
  return m.slot("bbox")(m, painter);
}

var drawProcModel = function(m, painter)
{
  return m.slot("draw")(m, painter);
}

var testInsideProcModel = function(m, x, y, painter)
{
  return m.slot("inside")(m, x, y, painter);
}

require('painter').HonestPainter.register('ProcedureModel', {bbox:getProcModelbbox, draw:drawProcModel, inside:testInsideProcModel});


var BuildingModel = function(alpha, model)
{
   var draw = function(m, painter)
   {
     var octx = painter.exec("sketchpad");
      octx.save();
      
      if (m.slot("shelterSprites") && m.slot("shelterSprites").length > 0)
      {
         debug.warning("how to set alpha in inner image model");
         octx.globalAlpha = alpha;
      }
      
      painter.exec("draw", m.slot("model"));
      
      octx.restore();
   };
   
   var bbox = function(m, painter)
   {
      return painter.exec("bbox", m.slot("model"));
   };
   
   var testInside = function(m, x, y, painter)
   {
      return painter.exec("inside", m.slot("model"), x, y, painter);
   };
   
   return ProcedureModel.create({draw:draw, bbox:bbox, inside:testInside, alpha:alpha, model:model});
};

/*======================================================================*/
var CompositeModel = Model.extend(
  undefined,
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);
      this.slot("type", "CompositeModel");

      if (param.matrix == undefined)
        this.slot("matrix", geo.identityMatrix());
      
      if (param.models == undefined)
        this.slot("models", []);
    },

    copy:function()
    {
      var param = {};

      this.ownSlotKeys().forEach(function(n)
                                  {
                                    param[n] = this.slot(n);
                                  },
                                 this);

      if (typeof(param.matrix) != "function")
        param.matrix = util.copy(param.matrix);

      param.models = param.models.map(function(m)
                                      {
                                        return m.exec("copy");
                                      });
      
      return CompositeModel.create(param);
    },
  },

  function(cls)
  {
    this.slot = function(key, val)
    {
      if (arguments.length == 1 && key == "matrix")
      {
        //var mat = this.execProto("slot", key);
        var mat = CompositeModel.superClass.slot.call(this, key);
        if (typeof(mat) == "function")
          return mat(require("director").director().exec("defaultPainter"));
        return mat;
      }
      
      return CompositeModel.superClass.slot.apply(this, Array.prototype.slice.call(arguments, 0));
    }
  });

var copyModel = function(m)
{
  return m.exec("copy");
}

var tagModel = function(m, tag)
{
  return CompositeModel.create({tag:tag, models:[m]});
}

var translateModel = function(m, x, y)
{
  return CompositeModel.create(
    {
      matrix:geo.matrixTranslateBy(geo.identityMatrix(), x, y), 
      models:[m]
    });
}

var rotateModel = function(m, r)
{
  return CompositeModel.create(
    {
      matrix:geo.matrixRotateBy(geo.identityMatrix(), r), 
      models:[m]
    });
}

var scaleModel = function(m, sx, sy)
{
  return CompositeModel.create(
    {
      matrix:geo.matrixScaleBy(geo.identityMatrix(), sx, sy), 
      models:[m]
    });
}

var transformModel = function(m, matrix)
{
  return CompositeModel.create(
    {
      matrix:matrix,
      models:[m]
    });
}

var moveRelative = function(ratioX, ratioY, m)
{
  var mat = function(painter)
  {
    var bbox = painter.exec("bbox", m);
    
    return geo.matrixTranslateBy(geo.identityMatrix(), bbox.size.width * ratioX, bbox.size.height * ratioY);
  }

  return CompositeModel.create({
    matrix:mat,
    models:[m],
  });
}

var drawCompositeModel = function(m, painter)
{
  var pjs = painter.exec("sketchpad");
  var mat = m.slot("matrix");

  pjs.save();
  // pjs.translate(mat.a, mat.c, mat.tx,
  //               mat.b, mat.d, mat.ty);
   
   //FIXME: 这里貌似要对model进行排序。。。还是在view模块中排序？
  
  pjs.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);

  m.slot("models").forEach(function(m)
                           {
                             painter.exec("draw", m);
                           });
  pjs.restore();
}

var bbox = function(m, painter)
{
  var b = geo.rectMake(0, 0, 0, 0);
  var mat = m.slot("matrix");
  
  m.slot("models").forEach(function(subm)
                           {
                             var subbbox = geo.rectApplyMatrix(painter.exec("bbox", subm), mat);
                             b = geo.rectUnion(b, subbbox);
                           });

  return b;
}

/*
  inside返回值说明：
  非CompositeModel的model返回true跟false来判断点是否在model区域内。

  CompositeModel返回
  1，true  点在model内，但是没有路径信息。
  2，path  类型为string，且string.length > 0 
  3，false 点不在model内。

  判断的时候建议使用 
  painter.inside(m) == false 或者 painter.inside(m) === false， 

  不建议使用
  !painter.side(m)  因为!"" === true
  但是目前的代码这样写也不会出现问题
  因为当返回字符串的时候，字符串的长度大于0，此时用!painter.inside(m)也是可以的。
*/
var inside = function(m, x, y, painter)
{
  var matrix = geo.matrixInvert(m.slot('matrix'))
  ,   newpos = geo.pointApplyMatrix({x:x, y:y}, matrix)
  ,   path = true
  ,   subpath = false
  ,   tag = m.slot("tag");

  var bHit = 
    m.slot("models")
    .slice(0)
    .reverse()
    .some(function(subm)
          {
            subpath = painter.exec("inside", subm, newpos, painter);
            if (subpath)
              return true;

            return false;
          });

  if (bHit)
  {
    //subpath  is true or string
    if (subpath === true)
      return tag ? tag : true;
    else
    {
      debug.assert(subpath.length > 0, "logical error");

      return (tag ? tag + "/" : "") + subpath;
    }
  }

  return false;
}

require('painter').HonestPainter.register('CompositeModel', {bbox:bbox, draw:drawCompositeModel, inside:inside});

var getModelsByPath = function(m, path, ret)
{
  var paths = path.split("/");
  
  if (paths.length == 0)
    return false;

  ret.push(m);

  if (m.slot("tag") == paths[0])
  {
    paths.splice(0, 1);
    if (paths.length == 0)
      return true;
  }

  var bFind = 
    m.slot("models")
    .filter(function(m)
            {
              if (m.slot("type") == "CompositeModel")
                return true;
            })
    .some(function(subm)
          {
            if (true == getModelsByPath(subm, paths.join("/"), ret))
            {
              return true;
            }

            return false;
          });

  if (bFind == false)
  {
    ret.pop(m);
    return false;
  }

  return true;
}

var relativePstn = function(m, pstn, path)
{
  var ms = [];
  if (false === getModelsByPath(m, path, ms))
  {
    return;
  }

  var mat = geo.identityMatrix();
  ms.forEach(function(am)
             {
               var m = am.slot("matrix");
               geo.matrixMultBy(mat, m);
             });
  
  geo.matrixInvertBy(mat);
  return geo.pointApplyMatrix(pstn, mat);
}

var getPath = function(pm, m)
{
  /*_getpath: 返回值说明
    true:匹配成功，找到m
    false:匹配失败，没找到m
    
    paths:匹配成功的话，paths.join("/")为路径 --> 路径可能为"", 空字符串。
  */
  var _getPath = function(pm, m, paths)
  {
    if (pm.slot("tag"))
      paths.push(pm.slot("tag"));

    //if find it
    if (pm == m)
      return true;

    var bFind = 
      pm.slot("models")                       
      .some(function(pm)
            {
              if (_getPath(pm, m, paths) == true)
              {
                return true;
              }

              return false;
            });
    
    if (false == bFind)
    {
      if(pm.slot("tag"))
        ret.paths.pop();

      return false;
    }

    return true;
  };

  var paths = [];

  if (false == _getpath(pm, m, paths))
  {
    return false;
  }
  else
    return paths.join("/");
}


var findModel = function(m, path)
{
  var ms = [];
  if (getModelsByPath(m, path, ms) === false)
    return;
  
  return ms[ms.length-1];
}

var removeModel = function(m, path)
{
  var ms = [];
  if (getModelsByPath(m, path, ms) === false)
    return;

  if (ms.length < 2)
    return;

  var pm = ms[ms.length-2]
  ,   dm = ms[ms.length-1]
  ,   pms = pm.slot("models")

  pms.splice(pms.indexOf(dm), 1);
  pm.slot("models", pms);

  return dm;
}

var replaceModel = function(m, path, nm)
{
  var ms = [];
  if (getModelsByPath(m, path, ms) === false)
    return;

  if (ms.length < 2)
    return;

  var pm = ms[ms.length-2]
  ,   dm = ms[ms.length-1]
  ,   pms = pm.slot("models")

  pms.splice(pms.indexOf(dm), 1, nm);
  pm.slot("models", pms);

  return dm;
}

var addModel = function(m, nm, path)
{
  if (path === undefined && m.slot("type") == "CompositeModel")
  {
    m.slots("models").push(nm);
    return nm;
  }

  var ms = [];
  if (getModelsByPath(m, path, ms) === false)
    return;

  ms[ms.length-1].slot("models").push(nm);
  return nm;
}

var overlap = function()
{
  var models = Array.prototype.slice.call(arguments, 0);

  return CompositeModel.create({
    matrix:geo.identityMatrix(),
    models:models});
}

var alignByBbox = function(bHorizontal, bVertical, spaceX, spaceY)
{
  var mat = geo.identityMatrix();

  var models = Array.prototype.slice.call(arguments, 4);

  var xOffset = 0, yOffset = 0, painter = require("director").director().exec("defaultPainter");
  var nmodels = models.map(function(m, i)
                           {
                             var mat = geo.matrixTranslateBy(geo.identityMatrix(), xOffset, yOffset, 0);
                             var nm = CompositeModel.create({matrix:mat, models:[m]});

                             var bbox = painter.exec("bbox", m);
                             
                             if (bHorizontal)
                               xOffset += bbox.size.width + spaceX;

                             if (bVertical)
                               yOffset += bbox.size.height + spaceY;

                             return nm;
                           });

  return overlap.apply(undefined, nmodels);
}

var hAlign = function(s)
{
  var args = Array.prototype.slice.call(arguments, 1)
  args.splice(0, 0, true, false, s, 0);
  return alignByBbox.apply(undefined, args);
}

var vAlign = function(s)
{
  var args = Array.prototype.slice.call(arguments, 1)
  args.splice(0, 0, false, true, 0, s);
  return alignByBbox.apply(undefined, args);
}

var _changeModelProxy = function(m, painter, dosomething)
{
  var subm = m.slot("models")[0];
  var prop = m.slot("prop");
  var val = m.slot("val");
  var changer = m.slot("changer");
  var restorer = m.slot("restorer");
  var old;

  if (changer)
    old = changer(subm, val);
  else
  {
    old = {
      prop:prop,
      val: subm.slot(prop)
    };

    subm.slot(prop, val);
  }
  
  var ret = dosomething(subm);

  if (restorer)
  {
    restorer(subm, old)
  }
  else
    subm.slot(old.prop, old.val);

  return ret;
}

var _changeModelDraw = function(m, painter)
{
  return _changeModelProxy(m, painter, 
                           function(subm)
                           {
                             return painter.exec("draw", subm);
                           });
}

var _changeModelbbox = function(m, painter)
{
  return _changeModelProxy(m, painter, 
                           function(subm)
                           {
                             return painter.exec("bbox", subm);
                           });
}

var _changeModelInside = function(m, x, y, painter)
{
  return _changeModelProxy(m, painter, 
                           function(subm)
                           {
                             return painter.exec("inside", subm, {x:x, y:y},  painter);
                           });
}

var changePropModel = function(m, prop, val, changer, restorer)
{
  return ProcedureModel.create({
    models:[m],
    draw:_changeModelDraw, 
    bbox:_changeModelbbox,
    inside:_changeModelInside,
    prop:prop, 
    val:val, 
    changer:changer,
    restorer:restorer});
}

exports.Model = Model;
exports.ArcModel = ArcModel;
exports.LineModel = LineModel;
exports.CircleModel = CircleModel;
exports.ConvexModel = ConvexModel;
exports.TextModel = TextModel;
exports.ImageModel = ImageModel;
exports.MapModel = MapModel;
exports.ClipModel = ClipModel;
exports.ProcedureModel = ProcedureModel;
exports.BuildingModel = BuildingModel;
exports.CompositeModel = CompositeModel;
exports.copyModel = copyModel;
exports.tagModel = tagModel;
exports.translateModel = translateModel;
exports.rotateModel = rotateModel;
exports.scaleModel = scaleModel;
exports.transformModel = transformModel;
exports.moveRelative = moveRelative;
exports.getModelsByPath = getModelsByPath;
exports.relativePstn = relativePstn;
exports.getPath = getPath;
exports.findModel = findModel;
exports.removeModel = removeModel;
exports.replaceModel = replaceModel;
exports.addModel = addModel;
exports.overlap = overlap;
exports.hAlign = hAlign;
exports.vAlign = vAlign;
exports.changePropModel = changePropModel;

}};