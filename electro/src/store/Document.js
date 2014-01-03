"use strict";

var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;
var Revision = require("../core/Revision");
var MessageType = require("../core/Wire").MessageType;

// TODO (jwilde): What order should the place and client arguments be?
//                It's all rather inconsistent right now across the codebase.

function Cursor(place, client) {
  this._place = place;
  this._client = client;
}

Cursor.prototype = {
  getPlace: function () { return this._place; },
  getClient: function () { return this._client; }
};

function Document(initialData) {
  EventEmitter.call(this);
  this._baseRevision = new Revision(0, initialData || {});
  this._changesets = [];
  this._cursors = [];
}

Document.prototype = _.extend({
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

  // TODO (jwilde): The entire cursor data storage architecture here is going
  //                to be really slow when there are large numbers of users.
  //                Can we somehow get and use a Map datastructure polyfill?

  getCursors: function () {
    return this._cursors;
  },

  getCursorForClient: function (client) {
    return _.find(this._cursors, function (cursor) { 
      return client == cursor.getClient(); 
    });
  },

  setCursorForClient: function (client, place) {
    var oldCursor = this.getCursorForClient(client);
    var newCursor = new Cursor(place, client);

    this._cursors = _.without(this._cursors, oldCursor).concat(newCursor);
    this.emit(MessageType.CursorMove, newCursor, oldCursor, client);
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
    this.emit(MessageType.Commit, changeset, committer);
  }
}, EventEmitter.prototype);

module.exports = Document;
