
__resources__["/__builtin__/painter/honestpainter.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var debug = require("debug");
var assert = require("debug").assert;
var abs = Math.abs;
var pow = Math.pow;
var CanvasEventDecider = require("canvaseventdecider").CanvasEventDecider;
var geo = require("geometry");

var Klass = require("base").Klass
,   Trait = require("oo").Trait;


var hvBboxTbl = {
  model: function (m, painter)
  {
    return geo.rectMake(0, 0, 0, 0);
  },

  circle : function (m, painter)
  {
    var r = m.slot("radius");
    return bbox = geo.rectMake(0, 0, 2*r, 2*r);
  },

  convex : function (m, painter)
  {
    var left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    var vs = m.slot("vertexes");
    
    for (var i in vs)
    {
      var p = vs[i];
      left = (p.x < left) ? p.x : left;
      top = (p.y < top) ? p.y : top;
      right = (p.x > right) ? p.x : right;
      bottom = (p.y > bottom) ? p.y : bottom;
    }
    
    return geo.rectMake(left, top, right - left + 1, bottom - top + 1);
  },

  text: function (m, painter)
  {
    var ctx = painter.slot("_ctx");
    var str = m.slot("text");
    var h = m.slot("height");
    var fontN = m.slot("font");
    fontN = (fontN === undefined) ? "Arial" : fontN;

    var oldFont = ctx.font;

    ctx.font = "" + h + " " + fontN;

    var w = ctx.measureText(str).width;

    ctx.font = oldFont;

    return geo.rectMake(0, 0, w, h);
  },

  image : function (m, painter)
  {
    var bbox = geo.rectMake(0, 0, m.slot("width"), m.slot("height"));
    bbox.nocache = !m.slot("image").complete;

    return bbox;
  },

  map: function (m, painter)
  {
    var mp = m.slot("map");
    return geo.rectMake(0, 0, mp.widthPx, mp.heightPx);
  }
};


var hvInsideTbl = {
  model: function (m, x, y, painter)
  {
    return false;
  },

  circle : function (m, x, y, painter)
  {
    var r = m.slot("radius");
    var d2 = pow(x - r, 2) + pow(y - r, 2);
    return d2 <= r * r;
  },

  convex : function (m, x, y, painter)
  {
    var vs = m.slot("vertexes");
    var len = vs.length;
    var accum = 0;
    var diffSign = false;
    var onSide = false;
    for (var i = 0; i < len; ++i)
    {
      var p1 = vs[i];
      var p2 = vs[(i + 1) % len];
      var s = x - p1.x, t = y - p1.y;
      var u = x - p2.x, v = y - p2.y;
      var cross = s * v - t * u;
      var lastaccum = accum;
      if (cross > 0)
      {
        accum += 1;
      }
      else if(cross === 0)
      {
        // test whether just on the side segment
        if ((s * u <= 0))
        {
          onSide = true;
        }
      }
      else
      {
        accum -= 1;
      }

      if (abs(accum) < abs(lastaccum))
      {
        diffSign = true;
        break;
      }
    }

    if (diffSign)
    {
      return false;
    }

    if (accum === 0)
    {
      return onSide;
    }

    return true;
  },

  text: function (m, x, y, painter)
  {
    return true;
  },

  image : function (m, x, y, painter)
  {
    // todo: consider when alpha is 0
    //var i = m.get("image");

    return true;
  },

  map: function (m, x, y, painter)
  {
    return true;
  }
};

var beginDrawMode = function (m, ctx)
{
  var oldStyles = {fill:ctx.fillStyle, stroke:ctx.strokeStyle};

  var fillc = m.slot("fill");

  debug.assert(typeof(fillc) == "string" || fillc == undefined, "color format changed to rgb(0, 0, 0)");
  
  if (fillc !== undefined)
  {
    ctx.fillStyle = fillc;
  }
  
  var sc = m.slot("stroke");
  
  if (sc !== undefined)
  {
    ctx.strokeStyle = sc;
  }

  return oldStyles;
}

var endDrawMode = function (m, ctx, oldStyles)
{
  ctx.fillStyle = oldStyles.fill;
  ctx.strokeStyle = oldStyles.stroke;
}

var hvDraw = {
  model: function (m,painter)
  {
    
  },

  circle : function (m,painter, spad)
  {
    var ctx = spad || painter.slot("_ctx");
    var r = m.slot("radius");
    var oldStyles = beginDrawMode(m, ctx);

    ctx.translate(r, r);

    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI*2, 0, true);
    ctx.closePath();

    if (m.slot("fill") != undefined)
      ctx.fill();
    if (m.slot("stroke") != undefined)
      ctx.stroke();

    endDrawMode(m, ctx, oldStyles);

    ctx.translate(-r, -r);
  },

  convex : function (m, painter, spad)
  {
    var ctx = spad || painter.slot("_ctx");
    var vs = m.slot("vertexes");
    var oldStyles = beginDrawMode(m, ctx);
    ctx.beginPath();
    for (var i in vs)
    {
      var p = vs[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath(oldStyles);

    if (m.slot("fill") != undefined)
      ctx.fill();
    if (m.slot("stroke") != undefined)
      ctx.stroke();

    endDrawMode(m, ctx, oldStyles);
  },

  text: function (m, painter, spad)
  {
    var ctx = spad || painter.slot("_ctx");
    var str = m.slot("text");
    var oldStyles = beginDrawMode(m, ctx);
    var h = m.slot("height");

    var oldFont = ctx.font;

    //FIXME:text 不能直接从0 0开始画，这样显示的是从baseline还是什么位置开始画的。同理boundingbox也需要调整。
    var fontN = m.slot("font");
    fontN = (fontN === undefined) ? "Arial" : fontN;

    ctx.font = "" + h + " " + fontN;

    var oldTextBaseline = ctx.textBaseline;
    ctx.textBaseline = "top"
    ctx.fillText(str, 0, 0);

    ctx.textBaseline = oldTextBaseline;

    endDrawMode(m,ctx, oldStyles);
  },

  image : function (m, painter, spad)
  {
    var ctx = spad || painter.slot("_ctx");
    //var oldStyles = beginDrawMode(m, ctx);
    var i = m.slot("image");
    if (i.loaded && i.naturalWidth != 0)
    {
      var w = m.slot("width");
      var h = m.slot("height");
      var alpha = m.slot("alpha");
      var gAlpha = ctx.globalAlpha;

      if(alpha != gAlpha)
      {
        ctx.globalAlpha = alpha;
      }

      ctx.drawImage(i, 0, 0, w, h, 0, 0, w, h);
      ctx.globalAlpha = gAlpha;
    }
    else
    {
      if (painter.exec("showUnloadedImage"))
      {
        ctx.fillStyle = "white";

        ctx.fillRect(0, 0, m.width, m.height);

        var oldWidth = ctx.lineWidth;

        ctx.lineWidth = 5;
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(m.width-1, m.height-1);

        ctx.moveTo(m.width-1, 0);
        ctx.lineTo(0, m.height-1);

        ctx.stroke();

        var oldFont = ctx.font;
        var oldTextBaseline = ctx.textBaseline;
        
        ctx.font = "32 Arial";
        ctx.textBaseline = "top";

        ctx.fillText("未加载\n的图片", 0, 0);
        ctx.font = oldFont;
        ctx.textBaseline = oldTextBaseline;
      }
    }

    //endDrawMode(m, ctx, oldStyles);
  },

  map: function (m, painter, spad)
  {
    var ctx = spad || painter.slot("_ctx");
    var map = m.slot("map");
    var width = painter.slot("_canvas").width, height = painter.slot("_canvas").height;

    map.paint(ctx, 
              0, 0, width, height,
              0, 0, width, height);
  }
};

var honestViewTrait = Trait.extend({
  initialize: function (param)
  {
    this.execProto("initialize");

    this.slot("_canvas", param);
    this.slot("_ctx", this.slot("_canvas").getContext("2d"));
    this.slot("_showUnloadedImage", true);
  },

  sketchpad: function()
  {
    return this.slot('_ctx');
  },

  canvas:function()
  {
    return this.slot("_canvas");
  },

  bbox: function (m)
  {
    var cache = m.slot("cache");
    if (cache.bbox !== undefined)
    {
      return cache.bbox;
    }

    var f = hvBboxTbl[m.slot("type")];
    assert(f, "no bounding box calculator for the `" + m.slot("type") + "' type of model");
    var res = f(m, this);
    if (!res.nocache)
    {
      cache.bbox = res;
    }
    else
    {
      cache.bbox = undefined;
    }
    return res;
  },

  /*
  anchorPoint: function (m)
  {
    var cache = m.slot("cache");
    if (cache.anchorPoint !== undefined)
    {
      return cache.anchorPoint;
    }

    var ap = m.slot("anchorPoint");
    var res;
    if (!ap.ratio)
    {
      res = {x:ap.point.x, y:ap.point.y};
    }
    else
    {
      var bbox = this.bbox(m);
      var x = bbox.left + bbox.width * ap.point.x;
      var y = bbox.top  + bbox.height * ap.point.y;
      res = {x:x, y:y, nocache:bbox.nocache};
    }

    if (!res.nocache)
      cache.anchorPoint = res;
    else
      cache.anchorPoint = undefined;
    return res;
  },
  */

  inside: function (m, p)
  {
    //var ap = this.anchorPoint(m);
    var bbox = this.exec("bbox", m);
    //var x = p.x + ap.x, y = p.y + ap.y;
    var x = p.x, y = p.y;
    if (bbox.origin.x <= x && x < (bbox.origin.x + bbox.size.width) 
        && bbox.origin.y <= y && y < (bbox.origin.y + bbox.size.height))
    {
      var f = hvInsideTbl[m.slot("type")];
      assert(f, "no inside function for the `" + m.slot("type") + "' of model");
      return f(m, x, y, this);
    }
    else
    {
      return false;
    }
  },

  showUnloadedImage: function(flag)
  {
    if (flag === undefined)
    {
      return this.slot("_showUnloadedImage");
    }
    else
    {
      this.slot("_showUnloadedImage", flag);
      return flag;
    }
  },

  draw : function (m, spad)
  {
    var ctx = spad || this.slot("_ctx");
    var t = m.slot("type");
    var f = hvDraw[t];      
    assert(f, "no draw function for type `" + t + "'");
    
    //var ap = this.anchorPoint(m);
    
    ctx.save();
    //ctx.translate(-ap.x, -ap.y);
    f(m, this, ctx);
    ctx.restore();
  },

  clear: function ()
  {
    var ctx = this.slot("_ctx");
    ctx.clearRect(0,0,this.slot("_canvas").width, this.slot("_canvas").height);
  },

  // redraw : function (content)
  // {
  //   var ctx = this.slot("_ctx");
  //   //pjs.externals.context.clearRect(0,0,pjs.width, pjs.height);
  //   // content.sort(this.slot("_cmpSprites")); //sortByZ(content);
  //   var it = content.iterator();

  //   content.forEach(function(c)
  //                   {
  //                      this.exec("drawItem", c);
  //                   },
  //                   this);
  // },
                                      
  // drawItem:function(node)
  // {
  //    this.exec("drawModel", node.exec("model"), node.exec("matrix"));
  // },                                    
                                      
  drawModel:function(model, mat)
  {
     var t = model.slot("type");
     var f = hvDraw[t];
     
     var ctx = this.slot("_ctx");
     ctx.save();
     ctx.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);
     
     //var ap = this.anchorPoint(model);
     //ctx.translate(-ap.x, -ap.y);

     f(model, this);
     
     ctx.restore();
  },

  drawModels:function(ms)
  {
    var self = this;
    ms.forEach(function(mp)
               {
                 self.exec("drawModel", mp[0], mp[1].matrix);
               });
  },

  drawDispList : function (list)
  {
    var ctx = this.slot("_ctx");
    //pjs.externals.context.clearRect(0,0,pjs.width, pjs.height);
    for (var i = 0; i < list.length; ++i)
    {
      var mat = list[i][0];
      var m = list[i][1];
      var t = m.slot("type");
      var f = hvDraw[t];
      
      ctx.save();
      assert(f, "no draw function for type `" + t + "'");
      ctx.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);

      // var ap = this.anchorPoint(m);
      // ctx.translate(-ap.x, -ap.y);

      f(m, this);

      ctx.restore();
    }
  },

  eventDecider:function()
  {
    if (!this.slot("_evtDecider"))
    {
      this.slot("_evtDecider", new CanvasEventDecider(this.exec("canvas")));
    }

    return this.slot("_evtDecider");
  },
});

var HonestPainter = Klass.extend([honestViewTrait]);


HonestPainter.register = function (type, fs)
{
  assert(!hvDraw[type],type + " has already exist in draw functions table");
  assert(!hvBboxTbl[type],type + " has already exist in bbox functions table");
  assert(!hvInsideTbl[type],type + " has already exist in inside functions table");

  hvDraw[type] = fs.draw;
  hvBboxTbl[type] = fs.bbox;
  hvInsideTbl[type] = fs.inside;
  return fs;
}

hvDraw = hvDraw;
hvBboxTbl = hvBboxTbl;
hvInsideTbl = hvInsideTbl;

exports.HonestPainter = HonestPainter;

}};