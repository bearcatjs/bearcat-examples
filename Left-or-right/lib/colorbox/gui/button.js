
__resources__["/__builtin__/gui/button.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var util = require("util");
var model = require("model");
var Actor = require("node").Actor;
var debug = require("debug");

var Button = Actor.extend(
  [],
  {
    initialize:function(param)
    {
      debug.assert(param.level && param.cb && param.normalModel, "parameter error");
      
      var self = this;

      param.model = param.normalModel;

      this.execProto("initialize", param);

      this.slot("_cb", param.cb);
      this.slot("_normalModel", param.normalModel);
      this.slot("_clickModel", param.clickModel);
      this.slot("_pressModel", param.pressModel);
      this.slot("_releaseModel", param.releaseModel);

      var cb = function(evt)
      {
        switch(evt.type){
        case 'mouseClicked':
          if (self.slot("_clickModel") != undefined)
            self.exec("setModel", self.slot("_clickModel"))
          break;
        case 'mousePressed':
          if(self.slot("_pressModel") != undefined)
            self.exec("setModel", self.slot("_pressModel"))
          break;
        case 'mouseReleased':
          if(self.slot("_releaseModel") != undefined)
            self.exec("setModel", self.slot("_releaseModel"));
          break;
        default:
          break;
        }
        self.slot("_cb")(evt, self);
      };
      
      this.exec("addEventListener", "mouseClicked", cb);
      this.exec("addEventListener", "mousePressed", cb);
      this.exec("addEventListener", "mouseReleased", cb);
    },
  });

exports.Button = Button;

}};