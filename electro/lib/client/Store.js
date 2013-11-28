"use strict";

var Document = require("./Document");

class Store {
  constructor(adapter) {
    this._adapter = adapter;
    this._documents = {};
  }

  get(name, revision = null) {
    // TODO
    if (!this._documents[name]) {
      this._documents[name] = new Document(name, adapter, revision);
    }
    return this._documents[name];
  }
}

module.exports = Store;
