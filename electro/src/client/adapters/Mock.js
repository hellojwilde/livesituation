"use strict";

var Q = require("q");
var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;

var Store = require("../../store/Store");
var Place = require("../../core/Place");
var MessageType = require("../../core/Wire").MessageType;

function MockAdapter (initialData, delay) {
  EventEmitter.call(this);
  this._store = initialData || new Store();
  this._subs = [];
  this._delay = _.isUndefined(delay) ? 200 : delay;

  // TODO (jwilde): Is there a way that we can reduce the repetition on these
  //                proxy methods (maybe with some sort of internal 
  //                createEventProxy method)?

  this._commitEventProxy = 
    _.bind(function (changeset, committer) {
      _.delay(_.bind(function () {
        var event = (committer == this) ? MessageType.Ack 
                                        : MessageType.Commit;
        this.emit(event, changeset);
      }, this), this._delay);
    }, this);

  this._cursorMoveEventProxy = 
    _.bind(function (newCursor, oldCursor, client) {
      _.delay(_.bind(function () {
        if (client !== this) return;
        this.emit(MessageType.CursorMove, newCursor, oldCursor, client);
      }, this));
    }, this);
}

MockAdapter.prototype = _.extend({
  setFakeNetworkDelay: function (delay) { this._delay = delay; },

  getLatest: function (key) {
    return Q.fcall(_.bind(function () {
      return this._store.get(key).getLatest();
    }, this));
  },

  getCursor: function (key) {
    return Q.fcall(_.bind(function () {
      return this._store.get(key).getCursorForClient(this);
    }, this));
  },

  setCursor: function (key, place) {
    return Q.fcall(_.bind(function () {
      var normalized = Place.normalize(place);
      this._store.get(key).setCursorForClient(this, normalized);
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

      doc.on(MessageType.Commit, this._commitEventProxy);
      doc.on(MessageType.CursorMove, this._cursorMoveEventProxy);
    }, this));
  },

  unsubscribe: function (key) {
    return Q.fcall(_.bind(function () {
      if (!_.contains(this._subs, key))
        throw new Error("Not subscribed to this document.");

      var doc = this._store.get(key);
      this._subs = _.without(this._subs, key);

      doc.removeListener(MessageType.Commit, this._commitEventProxy);
      doc.removeListener(MessageType.CursorMove, this._cursorMoveEventProxy);
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
