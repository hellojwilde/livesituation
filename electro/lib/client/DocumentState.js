"use strict";

var {Synced} = require("./DocumentStrategy");

class DocumentState {
  constructor(name, adapter, revision) {
    this._name = name;
    this._adapter = adapter;
    this._strategy = new Synced(name, adapter, revision);
    adapter.subscribe(name, revision, this._handleMessage);
  }

  get name() { return this._name; }
  get revision() { return this._strategy.revision; }
  get strategy() { return this._strategy; }

  commit(changeset) {
    this._applyStrategy("commit", changeset);
  }

  _handleMessage(message) {
    switch (message.type) {
      case "ack":
        this._applyStrategy("handleAck", message.data);
        break;
      case "commit":
        this._applyStrategy("handleCommit", message.data);
        break;
    }
  }

  _applyStrategy(method, ...args) {
    var strategy = this._strategy[method](this._name, this._adapter, ...args);
    if (strategy != this._strategy) {
      this._strategy = strategy;
    }
  }
}

module.exports = DocumentState;
