"use strict";

var View = require("./View");
var State = require("./State");

function Client(adapter) {
  this._adapter = adapter;
}

Client.prototype = {
  getKeys: function () { 
    return this._adapter.getKeys(); 
  },
  
  get: function (key) {
    var adapter = this._adapter;
    return adapter.getLatest(key)
      .then(function (revision) {
        return adapter.subscribe(key, revision.getSequenceId())
          .then(function () {
            return new View(new State(key, adapter, revision));
          });
      });
  },

  create: function (key, data) { 
    return this._adapter.create(key, data); 
  },

  remove: function (key) { 
    return this._adapter.remove(key); 
  }
};

module.exports = Client;
