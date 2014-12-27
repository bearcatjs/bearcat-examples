
__resources__["/__builtin__/view/topview.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var debug = require("debug");
var util = require("util");
var geo = require("geometry");

var displaylist = [];
var actorlist = [];

//fixme:sceme 当做参数
var view = function(painter, scene)
{
  displaylist.length = 0;
  actorlist.length = 0;

  scene.exec("filt", actorlist, function(node){return true;});   
  
  actorlist.forEach(function(a)
                    {
                      return a.exec("emmitModels", displaylist);
                    });

  displaylist.sort(function(i1, i2)
                   {
                     return i1[1].matrix.tz - i2[1].matrix.tz;
                   });

  painter.exec("drawModels", displaylist);
};

var cmpZ =  function (n1, n2, painter)
{
  var m1 = n1.exec("matrix");
  var m2 = n2.exec("matrix");
  var ret = m1.tz - m2.tz;
  return ret;
}

exports.topView = view;
view.comparator = cmpZ;

}};