
__resources__["/__builtin__/view/isometricview.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var debug = require("debug");
var util = require("util");
var geo = require("geometry");

//helper utilities
var findsprite = function(scene, op)
{
  var rets = [];
  
  scene.exec("filt", rets, op);
  
  if (rets.length > 0)
    return rets[0];
  else
    return undefined;
};

var findspritelist = function(scene, op)
{
  var rets = [];
  
  scene.exec("filt", rets, op);
  
  return rets;
};

var getBuildings = function(scene)
{
  return findspritelist(scene, function(n)
                        {
                          return true == n.tryExec("isBuilding");
                        });
};

var getSprites = function(scene)
{
  return findspritelist(scene, function(n)
                        {
                          return true != n.tryExec("isBuilding") &&
                            n.exec("model") && "map" != n.exec("model").slot("type");
                        });
};

var getMapSprite = function(scene)
{
  return findsprite(scene,
                    function(n)
                    {
                      return n.exec("model") && n.exec("model").slot("type") == "map";
                    });
};

var getSpriteBBox = function(painter, sprite)
{
  var bbox = geo.rectApplyMatrix(painter.exec("bbox", sprite.exec("model")), sprite.exec("matrix"));
  
  // var mapIvtMatrix = geo.matrixInvert(mapNode.exec("matrix"));
  
  // var bbox2map = geo.rectApplyMatrix(bbox, mapIvtMatrix);

  return bbox;
};

var sortSpriteInBuildings = function(painter, mapData, ms, sprite)
{
  var bbox = getSpriteBBox(painter, sprite);

  var standPstn = {
    // x : bbox.left + bbox.width/2,
    x:bbox.origin.x + bbox.size.width/2,
    y:bbox.origin.y + bbox.size.height
    // y : bbox.top + bbox.height
  };
  
  var intersectMs = mapData.getEffectThingByBox(bbox);
  
  var nearestM;
  intersectMs.filter(function(m)
                     {
                       return mapData.pointNearMapVSThing(standPstn.x, standPstn.y, m) <= 0;
                     }).
    forEach(function(m)
            {
              m.getUserData()["shelterSprites"].push(sprite);
              if (!nearestM || mapData.thing1NearMapVSThing2(m, nearestM) <= 0)
                nearestM = m;
            });
  
  if (nearestM)
    nearestM.getUserData()["sprites"].push(sprite);
  else
    ms[ms.length-1].getUserData()["sprites"].push(sprite);
};

var isSpriteNearthan = function(s1, s2, painter)
{
  var b1 = getSpriteBBox(painter, s1);
  var b2 = getSpriteBBox(painter, s2);

  var pstn1 = {x:b1.origin.x + b1.size.width/2, y:b1.origin.y + b1.size.height}
  ,   pstn2 = {x:b2.origin.x + b2.size.width/2, y:b2.origin.y + b2.size.height};
  
  return Math.pow(pstn1.x, 2) + Math.pow(pstn1.y, 2) - Math.pow(pstn2.x, 2) - Math.pow(pstn2.y, 2);
};

var sortRenderObjects = function(painter, mapNode, sprites)
{
  var mapData, ms;
  
  if (mapNode)
  {
    mapData = mapNode.exec("model").slot("map");
    ms = mapData.getThingMatters();
  }
  
  if (!mapNode || !ms || 0 == ms.length)
    return {sprites:sprites.sort(function(n1, n2){return isSpriteNearthan(n1, n2, painter)})};
  
  //初始化挂载在matter上的数据
  ms.forEach(function(m)
             {
               var data = m.getUserData();
               data["sprites"] = [];
               data["shelterSprites"] = [];
               
               m.setUserData(data);
             });
  
  //将精灵插入到相应的building上，且得到标记会挡住该精灵的所有building
  sprites.forEach(function(sprite)
                  {
                    sortSpriteInBuildings(painter, mapData, ms, sprite);
                  });
  
  //排序所有精灵
  ms.forEach(function(m)
             {
               m.getUserData()["sprites"].sort(function(n1, n2){return isSpriteNearthan(n1, n2, painter)});
             });
  
  return {ms:ms};
};

var view = function(painter, scene)
{
  var director = require("director").director();
  // var scene = director.exec("getLevel").exec("scene");
  var mapNode = getMapSprite(scene);
  
  //{ms:ms, sprites:sprites}
  var os = sortRenderObjects(painter, mapNode, getSprites(scene));

  //有的时候创建出了精灵，但是又希望遮挡关系还是通过matter进行，那么此时需要得到的matters中还是包含了这个精灵，但是渲染的时候，就直接扔给所对应的精灵进行渲染。
  //如果matter没有对应精灵，那么会直接渲染model。
  
  //fixme: 这里不需要判断buildingsprite的model，直接画unit上的model，如果需要修改这个model，直接去修改unit上的model
  // var buildingSprites = getBuildings(scene).reduce(function(ret, bs)
  //                                                  {
  //                                                    ret[bs.exec("mapData").identifier] = bs;
  //                                                    return ret;
  //                                                  },
  //                                                  {});
  
  if (mapNode)
    painter.exec("drawItem", mapNode);
  
  if (os.sprites)
    os.sprites.forEach(function(s)
                       {
                         painter.exec("drawItem", s);
                       });
  
  var mapNodeMatrix = mapNode.exec("matrix");
  if (os.ms)
    os.ms.forEach(function(m)
                  {
                    m.getUserData()["sprites"].forEach(function(s)
                                                       {
                                                         var displaylist = [];
                                                         s.exec("emmitModels", displaylist)
                                                         painter.exec("drawModels", displaylist);
//                                                         painter.exec("drawItem", s);
                                                       });
                    
                    // var bsprite = buildingSprites[m.identifier];
                    // if (bsprite)
                    // {
                    //   bsprite.exec("model").slot("shelterSprites", m.getUserData()["shelterSprites"]);
                    //   painter.exec("drawItem", bsprite);
                    //   bsprite.exec("model").slot("shelterSprites", undefined);
                    //   return;
                    // }
                    
                    var model = m.getUserData()["basicModel"];
                    model.slot("shelterSprites", m.getUserData()["shelerSprites"]);
                    
                    var matrix = model.mat;
                    if (mapNodeMatrix)
                      matrix = geo.matrixMult(mapNodeMatrix, matrix);
                    
                    painter.exec("drawModel", model, matrix);
                    model.slot("shelterSprites", undefined);
                  });
};

var getGameWorldToViewMatrix = function(hMap)
{
  var mapWidth = hMap.getProperty("widthPx");

  return geo.Matrix(2,1,-2,1,mapWidth/2,0, 0);
};

view.comparator = isSpriteNearthan;

exports.isometricView = view;
//exports.sortRenderObjects = sortRenderObjects;
exports.getGameWorldToViewMatrix = getGameWorldToViewMatrix;


}};