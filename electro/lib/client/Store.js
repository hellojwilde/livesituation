"use strict";

var Document = require("./Document");
var Q = require("q");

class Store {
  constructor(adapter) {
    this._adapter = adapter;
    this._states = {};
  }

  get(name, revision) {
    return Q.async(function *() {
      if (!this._states[name]) {
        if (!revision) revision = yield adapter.getLatest(name);
        this._states[name] = new DocumentState(name, adapter, revision);
      }
      yield this._states[name];
    }.bind(this));
  }
}

module.exports = Store;
