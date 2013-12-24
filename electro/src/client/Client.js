"use strict";

var Fragment = require("./Fragment");
var State = require("./State");

function Client(adapter) {
  this._adapter = adapter;
}

Client.prototype = {
  getAdapter: function () { return this._adapter; },
  getKeys: function () { return this._adapter.getKeys(); },
  
  has: function (key) { return this._adapter.has(key); },
  remove: function (key) { return this._adapter.remove(key); },
  create: function (key, data) { return this._adapter.create(key, data); },
  
  get: function (key) {
    var adapter = this._adapter;
    return adapter.getLatest(key)
      .then(function (revision) {
        return adapter.subscribe(key, revision.getSequenceId())
          .then(function () {
            return new Fragment(key, adapter, new State(revision));
          });
      });
  },
};

module.exports = Client;
