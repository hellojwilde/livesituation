"use strict";

var Q = require("q");
var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;

var Store = require("../../store/Store");
var MessageType = require("../../core/Wire").MessageType;

function MockAdapter (initialData, delay) {
  EventEmitter.call(this);
  this._store = initialData || new Store();
  this._subs = [];
  this._delay = _.isUndefined(delay) ? 200 : delay;
  this._commitEventProxy = 
    _.bind(function (changeset, committer) {
      _.delay(_.bind(function () {
        var event = (committer == this) ? MessageType.Ack 
                                        : MessageType.CommitServer;
        this.emit(event, changeset);
      }, this), this._delay);
    }, this);
}

MockAdapter.prototype = _.extend({
  setDelay: function (delay) { this._delay = delay; },

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
