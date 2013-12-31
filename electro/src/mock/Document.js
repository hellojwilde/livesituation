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
    return this._changesets.slice(start, end);
  },

  commit: function (baseSequenceId, changeset) {
    var sequenceId = this.getSequenceId();

    if (baseSequenceId > sequenceId)
      throw "Invalid base sequence id.";

    if (baseSequenceId < sequenceId) {
      var changesets = this.getChangesets(baseSequenceId, sequenceId);
      changeset = _.reduce(changesets, function (transformed, set) {
        return set.transform(transformed);
      }, changeset);
    }

    this._changesets.push(changeset);
  },

  getSubscribers: function () {
    return _.keys(this._subscribers);
  },

  subscribe: function (id) {
    this._subscribers[id] = true;
  },

  isSubscribed: function (id) {
    return !_.isUndefined(this._subscribers[id]);
  }
};

module.exports = MockDocument;
