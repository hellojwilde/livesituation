"use strict";

var _ = require("underscore");

var PlaceEventEmitter = require("../core/PlaceEventEmitter");
var MessageType = require("../core/Wire").MessageType;
var SyncedStrategy = require("./Strategy").SyncedStrategy;

function State(key, adapter, revision) {
  PlaceEventEmitter.call(this);
  this._strategy = new SyncedStrategy(key, adapter, revision);

  if (adapter.on) {
    adapter.on(MessageType.Ack, _.bind(this.handleAck, this));
    adapter.on(MessageType.CommitServer, _.bind(this.handleServerCommit, this));
  }
}

State.prototype = _.extend({
  getKey: function () { return this._strategy.getKey(); },
  getRevision: function () { return this._strategy.getRevision(); },
  
  commit: function (changeset) {
    this._strategy = this._strategy.commitClient(changeset);
  },

  handleAck: function () {
    this._strategy = this._strategy.ack();
  },

  handleServerCommit: function (changeset) {
    this._strategy = this._strategy.commitServer(changeset);
    _.each(changeset.getChanges(), _.bind(function (change) {
      this.emit(change.getPlace(), "change", change);
    }, this));
  }
}, PlaceEventEmitter.prototype);

module.exports = State;
