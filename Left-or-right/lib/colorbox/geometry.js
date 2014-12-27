
__resources__["/__builtin__/geometry.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var util = require('util');

var RE_PAIR = /\{\s*([\d.\-]+)\s*,\s*([\d.\-]+)\s*\}/,
RE_DOUBLE_PAIR = /\{\s*(\{[\s\d,.\-]+\})\s*,\s*(\{[\s\d,.\-]+\})\s*\}/;

var cross = function(v1, v2)
{
  return v1.x * v2.y - v1.y * v2.x;
};

var geometry = 
  {
    Point: function (x, y) 
    {
      this.x = x;
      this.y = y;
    },

    Size: function (w, h) 
    {
      this.width = w;
      this.height = h;
    },

    Rect: function (x, y, w, h) 
    {
      this.origin = new geometry.Point(x, y);
      this.size   = new geometry.Size(w, h);
    },


    /*
      a  c  0  tx
      b  d  0  ty
      0  0  1  tz
      0  0  0  1
     */
    Matrix: function (a, b, c, d, tx, ty, tz) 
    {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.tx = tx;
      this.ty = ty;
      this.tz = tz;
    },

    ccp: function (x, y) 
    {
      return module.exports.pointMake(x, y);
    },

    ccpAdd: function (p1, p2) 
    {
      return geometry.ccp(p1.x + p2.x, p1.y + p2.y);
    },

    ccpAddBy:function(p1, p2)
    {
      p1.x += p2.x;
      p1.y += p2.y;

      return p1;
    },

    ccpSub: function (p1, p2) 
    {
      return geometry.ccp(p1.x - p2.x, p1.y - p2.y);
    },

    ccpSubBy:function(p1, p2)
    {
      p1.x -= p2.x;
      p1.y -= p2.y;

      return p1;
    },

    ccpMult: function (p1, p2) 
    {
      return geometry.ccp(p1.x * p2.x, p1.y * p2.y);
    },

    ccpMultBy:function(p1, p2)
    {
      p1.x *= p2.x;
      p1.y *= p2.y;

      return p1;
    },

    ccpNeg: function (p) 
    {
      return geometry.ccp(-p.x, -p.y);
    },

    ccpNegBy:function(p)
    {
      p.x = -p.x;
      p.y = -p.y;

      return p;
    },

    ccpRound: function (p) 
    {
      return geometry.ccp(Math.round(p.x), Math.round(p.y));
    },

    ccpRoundBy:function(p)
    {
      p.x = Math.round(p.x);
      p.y = Math.round(p.y);
      
      return p;
    },

    ccpCeil: function (p) 
    {
      return geometry.ccp(Math.ceil(p.x), Math.ceil(p.y));
    },

    ccpCeilBy:function(p)
    {
      p.x = Math.ceil(p.x);
      p.y = Math.ceil(p.y);

      return p;
    },

    ccpFloor: function (p) 
    {
      return geometry.ccp(Math.floor(p.x), Math.floor(p.y));
    },

    ccpFloorBy:function(p)
    {
      p.x = Math.floor(p.x);
      p.y = Math.floor(p.y);

      return p;
    },

    PointZero: function () 
    {
      return geometry.ccp(0, 0);
    },

    isPointInPolygon:function(p, convex)
    {
      //convex是顺时钟的点集
      var triangleIsCW = function(p1, p2, p3)
      {
        var a = geometry.ccpSub(p1, p3),
        b = geometry.ccpSub(p2, p3);
        
        return cross(a, b) > 0;
      };

      var low = 0, n = convex.length, high = n;

      do
      {
        var mid = Math.floor((low + high) / 2);
        if (triangleIsCW(convex[0], convex[mid], p))
          low = mid;
        else
          high = mid;

      }while(low+1<high);

      if (low == 0 || high == n)
        return false;
      
      return triangleIsCW(convex[low], convex[high], p);
    },
    
    getVectorAngle:function(v1, v2)
    {
      /*
        v1 到 v2的角度。 使用左手法则。 弧度位于 [0, 2PI] 
       */
      var cos = v2.x * v1.x + v2.y * v1.y;
      var mod = Math.sqrt(v2.x * v2.x + v2.y * v2.y) * Math.sqrt(v1.x * v1.x + v1.y * v1.y);

      if (mod == 0)
      {
        return undefined;
      }

      var radian = Math.acos(cos/mod);
      
      if (cross(v1, v2) < 0)
        radian = Math.PI * 2 - radian;
      
      return radian;
    },

    rectMake: function (x, y, w, h) 
    {
      return new geometry.Rect(x, y, w, h);
    },

    rectFromString: function (str) 
    {
      var matches = str.match(RE_DOUBLE_PAIR),
      p = geometry.pointFromString(matches[1]),
      s = geometry.sizeFromString(matches[2]);

      return geometry.rectMake(p.x, p.y, s.width, s.height);
    },

    sizeMake: function (w, h) 
    {
      return new geometry.Size(w, h);
    },

    sizeFromString: function (str) 
    {
      var matches = str.match(RE_PAIR),
      w = parseFloat(matches[1]),
      h = parseFloat(matches[2]);

      return geometry.sizeMake(w, h);
    },

    pointMake: function (x, y) 
    {
      return new geometry.Point(x, y);
    },

    pointFromString: function (str) 
    {
      var matches = str.match(RE_PAIR),
      x = parseFloat(matches[1]),
      y = parseFloat(matches[2]);

      return geometry.pointMake(x, y);
    },

    rectContainsPoint: function (r, p) 
    {
      return ((p.x >= r.origin.x && p.x <= r.origin.x + r.size.width) &&
              (p.y >= r.origin.y && p.y <= r.origin.y + r.size.height));
    },

    rectUnion: function (r1, r2) 
    {
      var rect = new geometry.Rect(0, 0, 0, 0);

      rect.origin.x = Math.min(r1.origin.x, r2.origin.x);
      rect.origin.y = Math.min(r1.origin.y, r2.origin.y);
      rect.size.width = Math.max(r1.origin.x + r1.size.width, r2.origin.x + r2.size.width) - rect.origin.x;
      rect.size.height = Math.max(r1.origin.y + r1.size.height, r2.origin.y + r2.size.height) - rect.origin.y;

      return rect;
    },

    rectOverlapsRect: function (r1, r2) 
    {
      if (r1.origin.x + r1.size.width < r2.origin.x) 
      {
        return false;
      }
      if (r2.origin.x + r2.size.width < r1.origin.x) 
      {
        return false;
      }
      if (r1.origin.y + r1.size.height < r2.origin.y) 
      {
        return false;
      }
      if (r2.origin.y + r2.size.height < r1.origin.y) 
      {
        return false;
      }

      return true;
    },

    rectIntersection: function (lhsRect, rhsRect) 
    {

      var intersection = new geometry.Rect(
        Math.max(geometry.rectGetMinX(lhsRect), geometry.rectGetMinX(rhsRect)),
        Math.max(geometry.rectGetMinY(lhsRect), geometry.rectGetMinY(rhsRect)),
        0,
        0
      );

      intersection.size.width = Math.min(geometry.rectGetMaxX(lhsRect), geometry.rectGetMaxX(rhsRect)) - geometry.rectGetMinX(intersection);
      intersection.size.height = Math.min(geometry.rectGetMaxY(lhsRect), geometry.rectGetMaxY(rhsRect)) - geometry.rectGetMinY(intersection);

      return intersection;
    },

    pointEqualToPoint: function (point1, point2) 
    {
      return (point1.x == point2.x && point1.y == point2.y);
    },

    sizeEqualToSize: function (size1, size2) 
    {
      return (size1.width == size2.width && size1.height == size2.height);
    },

    rectEqualToRect: function (rect1, rect2) 
    {
      return (module.exports.sizeEqualToSize(rect1.size, rect2.size) && module.exports.pointEqualToPoint(rect1.origin, rect2.origin));
    },

    rectGetMinX: function (rect) 
    {
      return rect.origin.x;
    },

    rectGetMinY: function (rect) 
    {
      return rect.origin.y;
    },

    rectGetMaxX: function (rect) 
    {
      return rect.origin.x + rect.size.width;
    },

    rectGetMaxY: function (rect) 
    {
      return rect.origin.y + rect.size.height;
    },

    boundingRectMake: function (p1, p2, p3, p4) 
    {
      var minX = Math.min(p1.x, p2.x, p3.x, p4.x);
      var minY = Math.min(p1.y, p2.y, p3.y, p4.y);
      var maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
      var maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

      return new geometry.Rect(minX, minY, (maxX - minX), (maxY - minY));
    },

    pointApplyMatrix: function (point, t) 
    {
      return new geometry.Point(t.a * point.x + t.c * point.y + t.tx, t.b * point.x + t.d * point.y + t.ty);
    },

    rectApplyMatrix: function (rect, trans) 
    {

      var p1 = geometry.ccp(geometry.rectGetMinX(rect), geometry.rectGetMinY(rect));
      var p2 = geometry.ccp(geometry.rectGetMaxX(rect), geometry.rectGetMinY(rect));
      var p3 = geometry.ccp(geometry.rectGetMinX(rect), geometry.rectGetMaxY(rect));
      var p4 = geometry.ccp(geometry.rectGetMaxX(rect), geometry.rectGetMaxY(rect));

      p1 = geometry.pointApplyMatrix(p1, trans);
      p2 = geometry.pointApplyMatrix(p2, trans);
      p3 = geometry.pointApplyMatrix(p3, trans);
      p4 = geometry.pointApplyMatrix(p4, trans);

      return geometry.boundingRectMake(p1, p2, p3, p4);
    },

    matrixInvert: function (trans) 
    {
      var determinant = 1 / (trans.a * trans.d - trans.b * trans.c);

      return new geometry.Matrix(
        determinant * trans.d,
          -determinant * trans.b,
          -determinant * trans.c,
        determinant * trans.a,
        determinant * (trans.c * trans.ty - trans.d * trans.tx),
        determinant * (trans.b * trans.tx - trans.a * trans.ty),
        /*now do not support z invert, just record z*/
        trans.tz
      );
    },

    matrixInvertBy: function (trans) 
    {
      var determinant = 1 / (trans.a * trans.d - trans.b * trans.c);

      var a = determinant * trans.d
      ,   b = -determinant * trans.b
      ,   c = -determinant * trans.c
      ,   d = determinant * trans.a
      ,   tx = determinant * (trans.c * trans.ty - trans.d * trans.tx)
      ,   ty = determinant * (trans.b * trans.tx - trans.a * trans.ty);

      trans.a = a;
      trans.b = b;
      trans.c = c;
      trans.d = d;
      trans.tx = tx;
      trans.ty = ty;

      return trans;
    },
     
    matrixMult: function (lhs, rhs) 
    {
      return new geometry.Matrix(
        lhs.a * rhs.a + lhs.c * rhs.b,
        lhs.b * rhs.a + lhs.d * rhs.b,
        lhs.a * rhs.c + lhs.c * rhs.d,
        lhs.b * rhs.c + lhs.d * rhs.d,
        lhs.a * rhs.tx + lhs.c * rhs.ty + lhs.tx,
        lhs.b * rhs.tx + lhs.d * rhs.ty + lhs.ty,
        lhs.tz + rhs.tz
      );
    },

    matrixMultBy: function (lhs, rhs) 
    {
      var a = lhs.a * rhs.a + lhs.c * rhs.b
      ,   b = lhs.b * rhs.a + lhs.d * rhs.b
      ,   c = lhs.a * rhs.c + lhs.c * rhs.d
      ,   d = lhs.b * rhs.c + lhs.d * rhs.d
      ,   tx = lhs.a * rhs.tx + lhs.c * rhs.ty + lhs.tx
      ,   ty = lhs.b * rhs.tx + lhs.d * rhs.ty + lhs.ty
      ,   tz = lhs.tz + rhs.tz;
      
      lhs.a = a;
      lhs.b = b;
      lhs.c = c;
      lhs.d = d;
      lhs.tx = tx;
      lhs.ty = ty;
      lhs.tz = tz;

      return lhs;
    },
    
    degreesToRadians: function (angle) 
    {
      return angle / 180.0 * Math.PI;
    },

    radiansToDegrees: function (angle) 
    {
      return angle * (180.0 / Math.PI);
    },

    matrixTranslate: function (trans, tx, ty, tz) 
    {
      var newTrans = util.copy(trans);
      newTrans.tx = trans.tx + trans.a * tx + trans.c * ty;
      newTrans.ty = trans.ty + trans.b * tx + trans.d * ty;
      
      if (tz != undefined)
      {
        if (trans.tz != undefined)
          newTrans.tz = trans.tz + tz;
        else
          newTrans.tz = tz;
      }
      
      return newTrans;
    },

    matrixTranslateBy: function (trans, tx, ty, tz) 
    {
      if (tz != undefined && trans.tz == undefined)
      {
        trans.tz = 0;
      }
      
      trans.tx = trans.tx + trans.a * tx + trans.c * ty;
      trans.ty = trans.ty + trans.b * tx + trans.d * ty;
      if (tz != undefined)
        trans.tz = trans.tz + tz;

      return trans;
    },

    matrixRotateBy: function (trans, angle) 
    {
      var sin = Math.sin(angle),
      cos = Math.cos(angle);

      var a, b, c, d;
      a = trans.a * cos + trans.c * sin;
      b = trans.b * cos + trans.d * sin;
      c = trans.c * cos - trans.a * sin;
      d = trans.d * cos - trans.b * sin;

      trans.a = a;
      trans.b = b;
      trans.c = c;
      trans.d = d;

      return trans;
    },

    matrixRotate: function (trans, angle) 
    {
      var sin = Math.sin(angle),
      cos = Math.cos(angle);

      var a, b, c, d;
      a = trans.a * cos + trans.c * sin;
      b = trans.b * cos + trans.d * sin;
      c = trans.c * cos - trans.a * sin;
      d = trans.d * cos - trans.b * sin;

      return new geometry.Matrix(
        a,
        b,
        c,
        d,
        trans.tx,
        trans.ty,
        trans.tz);
    },


    matrixScaleBy: function (trans, sx, sy) 
    {
      if (sy === undefined) 
      {
        sy = sx;
      }

      //return new geometry.TransformMatrix(trans.a * sx, trans.b * sx, trans.c * sy, trans.d * sy, trans.tx, trans.ty, trans.tz);
      trans.a *= sx;
      trans.b *= sx;
      trans.c *= sy;
      trans.d *= sy;

      return trans;
    },

    matrixScale: function (trans, sx, sy) 
    {
      if (sy === undefined) 
      {
        sy = sx;
      }

      return new geometry.Matrix(trans.a * sx, trans.b * sx, trans.c * sy, trans.d * sy, trans.tx, trans.ty, trans.tz);
    },

    identityMatrix: function () 
    {
      return new geometry.Matrix(1, 0, 0, 1, 0, 0, 0);
    },

    decomposeMatrix : function(matrix)
    {
      var sx = Math.sqrt(Math.pow(matrix.a, 2) + Math.pow(matrix.b, 2))
      ,   sy = Math.sqrt(Math.pow(matrix.c, 2) + Math.pow(matrix.d, 2))
      ,   radius = Math.acos(matrix.a/sx)
      ,   tx = matrix.tx
      ,   ty = matrix.ty
      ,   tz = matrix.tz;

      return {sx:sx, sy:sy, radian:radian, tx:matrix.tx, ty:matrix.ty, tz:matrix.tz};
    },
  };

module.exports = geometry;

}};