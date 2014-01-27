"use strict";

var _ = require("underscore");
var mori = require("mori");

var EventEmitter = require("events").EventEmitter;
var Revision = require("../core/Revision");
var MessageType = require("../core/Wire").MessageType;

function Document(initialData) {
  EventEmitter.call(this);
  this._baseRevision = new Revision(0, initialData || {});
  this._changesets = [];
  this._cursors = mori.hash_map();
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

  getCursor: function (client) {
    return mori.get(this._cursors, client);
  },

  setCursor: function (client, newPlace) {
    var oldPlace = this.getCursor(client);
    this._cursors = mori.assoc(this._cursors, client, newPlace);
    this.emit(MessageType.CursorMove, oldPlace, newPlace, client);
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
