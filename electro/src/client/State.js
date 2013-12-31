"use strict";

var _ = require("underscore");

var MessageType = require("../core/Wire").MessageType;
var SyncedStrategy = require("./Strategy").SyncedStrategy;

function State(key, adapter, revision) {
  this._strategy = new SyncedStrategy(key, adapter, revision);
  if (adapter.on) {
    adapter.on(MessageType.ServerAck, _.bind(this.handleServerAck, this));
    adapter.on(MessageType.ServerCommit, _.bind(this.handleServerCommit, this));
  }
}

State.prototype = {
  getKey: function () { return this._strategy.getKey(); },
  getRevision: function () { return this._strategy.getRevision(); },
  
  commit: function (changeset) {
    this._strategy = this._strategy.commitClient(changeset);
  },

  handleServerAck: function () {
    this._strategy = this._strategy.serverAck();
  },

  handleServerCommit: function (changeset) {
    this._strategy = this._strategy.serverCommit(changeset);
  }
};

module.exports = State;
