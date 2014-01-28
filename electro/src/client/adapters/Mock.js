"use strict";

var Q = require("q");
var _ = require("underscore");
var mori = require("mori");
var EventEmitter = require("events").EventEmitter;

var Store = require("../../store/Store");
var Place = require("../../core/Place");
var MessageType = require("../../core/Wire").MessageType;

function getDelayedMethodProxy(fn, thisArg, delay) {
  return function () {
    var args = arguments;
    setTimeout(function () { fn.apply(thisArg, args); }, delay);
  };
}

function MockAdapter (initialMockStore, fakeNetworkDelay) {
  EventEmitter.call(this);
  
  this._store = initialMockStore || new Store();
  this._subs = mori.set();
  this._delay = fakeNetworkDelay || 200;

  this._commitEventProxy = 
    getDelayedMethodProxy(function (changeset, committer) {
      var event = (committer == this) ? MessageType.Ack : MessageType.Commit;
      this.emit(event, changeset);
    }, this, this._delay);

  this._cursorMoveEventProxy = 
    getDelayedMethodProxy(function (client, oldCursor, newCursor) {
      if (client !== this) return;
      this.emit(MessageType.CursorMove, client, oldCursor, newCursor);
    }, this, this._delay);
}

MockAdapter.prototype = _.extend({
  getLatest: function (key) {
    return Q.fcall(_.bind(function () {
      return this._store.get(key).getLatest();
    }, this));
  },

  getCursor: function (key) {
    return Q.fcall(_.bind(function () {
      return this._store.get(key).getCursor(this);
    }, this));
  },

  setCursor: function (key, place) {
    return Q.fcall(_.bind(function () {
      var normalized = Place.normalize(place);
      this._store.get(key).setCursor(this, normalized);
    }, this));
  },

  isSubscribed: function (key) {
    return Q.fcall(_.bind(function () {
      return mori.has_key(this._subs, key);
    }, this));
  },

  subscribe: function (key) {
    return Q.fcall(_.bind(function () {
      if (_.contains(this._subs, key)) {
        throw new Error("Already subscribed to this document.");
      }

      var doc = this._store.get(key);
      this._subs = mori.conj(this._subs);

      doc.on(MessageType.Commit, this._commitEventProxy);
      doc.on(MessageType.CursorMove, this._cursorMoveEventProxy);
    }, this));
  },

  unsubscribe: function (key) {
    return Q.fcall(_.bind(function () {
      if (!mori.has_key(this._subs, key)) {
        throw new Error("Not subscribed to this document.");
      }

      var doc = this._store.get(key);
      this._subs = mori.disj(this._subs, key);

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
