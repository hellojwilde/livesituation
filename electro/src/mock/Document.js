"use strict";

var _ = require("underscore");
var Revision = require("../core/Revision");

function MockDocument(initialData) {
  this._baseRevision = new Revision(0, initialData || {});
  this._changesets = [];
  this._subscribers = {};
}

MockDocument.prototype = {
  getSequenceId: function () {
    return this._changesets.length;
  },

  getLatest: function () {
    return _.reduce(this._changesets, function (revision, changeset) {
      return changeset.apply(revision);
    }, this._baseRevision);
  },

  getChangesets: function (start, end) {
    return this._changesets.slice(start || 0, end);
  },

  commit: function (baseSequenceId, changeset, committer) {
    var sequenceId = this.getSequenceId();

    if (baseSequenceId > sequenceId) {
      throw new Error("Invalid base sequence id.");
    }

    if (baseSequenceId < sequenceId) {
      var changesets = this.getChangesets(baseSequenceId, sequenceId);
      changeset = _.reduce(changesets, function (transformed, set) {
        return set.transform(transformed);
      }, changeset);
    }

    this._changesets.push(changeset);
    
    // TODO (jwilde): Ideally rebuild this in a way that doesn't require 
    //                MockDocument to know that MockAdapter supports the
    //                EventEmitter interface and can emit events.

    _.each(this._subscribers, function (metadata, adapter) {
      var eventName = adapter == committer ? "ack" : "serverCommit";
      adapter.emit(eventName, changeset);
    });
  },

  getSubscribers: function () { 
    return _.values(this._subscribers); 
  },

  isSubscribed: function (adapter) { 
    return _.has(this._subscribers, adapter); 
  },

  subscribe: function (adapter, metadata) {
    this._subscribers[adapter] = metadata;
  },

  unsubscribe: function (adapter) {
    delete this._subscribers[adapter];
  }
};

module.exports = MockDocument;
