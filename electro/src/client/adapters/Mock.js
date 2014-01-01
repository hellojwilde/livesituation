"use strict";

var Q = require("q");
var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;

function MockAdapter (initialData) {
  EventEmitter.call(this);
  this._store = initialData;
  this._subs = [];
  this._commitEventProxy = _.bind(function (changeset, committer) {
    var event = (committer == this) ? "ack" : "serverCommit";
    this.emit(event, changeset);
  }, this);
}

MockAdapter.prototype = _.extend({
  getLatest: function (key) {
    return Q.fcall(_.bind(function () {
      return this._store.get(key).getLatest();
    }, this));
  },

  isSubscribed: function (key) {
    return Q.fcall(_.bind(function () {
      return _.contains(this._subs, this);
    }, this));
  },

  subscribe: function (key) {
    return Q.fcall(_.bind(function () {
      if (_.contains(this._subs, key))
        throw new Error("Already subscribed to this document.");

      var doc = this._store.get(key);
      this._subs.push(key);
      doc.on("commit", this._commitEventProxy);
    }, this));
  },

  unsubscribe: function (key) {
    return Q.fcall(_.bind(function () {
      if (!_.contains(this._subs, key))
        throw new Error("Not subscribed to this document.");

      var doc = this._store.get(key);
      this._subs = _.without(this._subs, key);
      doc.removeListener("commit", this._commitEventProxy);
    }, this));
  },

  commit: function (key, baseSequenceId, changeset) {
    return Q.fcall(_.bind(function () {
      this._store.get(key).commit(baseSequenceId, changeset, this);
    }, this));
  }
}, EventEmitter.prototype);

_.each(["getKeys", "create", "remove"], function (methodName) {
  MockAdapter.prototype[methodName] = function () {
    var method = this._store[methodName];
    return Q.fapply(_.bind(method, this._store), arguments);
  };
});

module.exports = MockAdapter;
