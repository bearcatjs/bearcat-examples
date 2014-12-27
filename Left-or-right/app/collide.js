var Collide = function() {
  this.$id = "collide";
  this.$colorBox = null;
  this.$init = "init";
  this.debug = null;
  this.geo = null;
  this.trains = [];
  this.props = [];
};

Collide.prototype.init = function() {
  this.debug = this.$colorBox.debug;
  this.geo = this.$colorBox.geo;
}

Collide.prototype.addTrain = function(train) {
  this.debug.assert(this.trains.indexOf(train) == -1, "add same train");

  this.trains.push(train);
};

Collide.prototype.rmTrain = function(train) {
  this.debug.assert(train == undefined || this.trains.indexOf(train) != -1, "remove non exist train");

  if (undefined == train)
    this.trains.length = 0;

  var idx = this.trains.indexOf(train);
  this.trains.splice(idx, 1);
};

Collide.prototype.addProp = function(prop) {
  this.debug.assert(this.props.indexOf(prop) == -1, "add same prop");

  this.props.push(prop);
};

Collide.prototype.rmProp = function(prop) {
  this.debug.assert(this.props.indexOf(prop) != -1, "remove non exist prop");

  if (undefined == prop)
    this.props.lenght = 0;

  var idx = this.props.indexOf(prop);
  this.props.splice(idx, 1);
};

Collide.prototype.isTrainCollide = function(t1, t2, painter) {
  var geo = this.geo;
  var bboxes1 = painter.exec("bbox", t1.exec("model"));
  var bboxes2 = painter.exec("bbox", t2.exec("model"));

  return bboxes1.some(function(bbox1) {
    return bboxes2.some(function(bbox2) {
      return geo.rectOverlapsRect(bbox1, bbox2);
    });
  });
};

Collide.prototype.isTrainEatProp = function(train, prop, painter) {
  var geo = this.geo;
  var trainbbox = painter.exec("bbox", train.exec("model"));
  var propbbox = painter.exec("bbox", prop.exec("model"));

  return trainbbox.some(function(tb) {
    return geo.rectOverlapsRect(tb, propbbox);
  });
};

Collide.prototype.resolve = function() {
  var collide = this;
  var d = this.$colorBox.director;

  var painter = d.director().exec("defaultPainter");

  //用来统计哪些train碰撞了train
  var diedTrains = [];
  diedTrains.length = this.trains.length;

  //collide train with train
  for (var i = 0; i < this.trains.length - 1; i++) {
    var train1 = this.trains[i];

    for (var j = i + 1; j < this.trains.length; j++) {
      var train2 = this.trains[j];

      if (this.isTrainCollide(train1, train2, painter)) {
        diedTrains[i] = true;
        diedTrains[j] = true;
      }
    }
  }

  var liveTrains = [],
    dieds = [];

  diedTrains.forEach(function(bDied, idx) {
    if (bDied) {
      //collide.trains[idx].exec("die");
      dieds.push(collide.trains[idx]);
    } else
      liveTrains.push(collide.trains[idx]);
  });
  dieds.forEach(function(die) {
    die.exec("die");
  });

  //记录每个train吃了哪些prop。不在找的过程中通知主要是考虑到prop或者train的通知函数可能同步从collide中删除自身
  var self = this;
  var eatedProps = [];
  liveTrains.forEach(function(train, idx) {
    collide.props.forEach(function(prop) {
      if (self.isTrainEatProp(train, prop)) {
        if (eatedProps[idx] == undefined)
          eatedProps[idx] = [prop];
        else
          eatedProps[idx].push(prop);
      }
    });
  });

  liveTrains.forEach(function(train, idx) {
    if (eatedProps[idx]) {
      eatedProps[idx].forEach(function(prop) {
        train.exec("eatProp", prop);
        prop.exec("eated", train);
      });
    }
  });
};

bearcat.module(Collide, typeof module !== 'undefined' ? module : {});