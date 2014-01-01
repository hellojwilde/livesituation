"use strict";

var Q = require("q");
var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;

var MockStore = require("./Store");
var MockDocument = require("./Document");

function proxyStoreMethod(methodName) {
  return function () {
    var method = this._store[methodName];
    return Q.fapply(_.bind(method, this._store), arguments);
  };
}

function proxyDocumentMethod(methodName) {
  return function (key) {
    var methodArgs = _.rest(arguments);
    return Q.fcall(_.bind(function () {
      var doc = this._store.get(key);
      return doc[methodName].apply(doc, methodArgs);
    }, this));
  };
}

function MockAdapter (initialData) {
  EventEmitter.call(this);
  this._store = initialData;
}

MockAdapter.prototype = _.extend({
  getKeys: proxyStoreMethod("getKeys"),

  create: proxyStoreMethod("create"),
  remove: proxyStoreMethod("remove"),

  getLatest: proxyDocumentMethod("getLatest"),
  getSubscribers: proxyDocumentMethod("getSubscribers"),
  isSubscribed: proxyDocumentMethod("isSubscribed"),

  subscribe: function (key) {
    return Q.fcall(_.bind(function () {
      this._store.get(key).subscribe(this, { localId: _.uniqueId() });
    }, this));
  },

  commit: function (key, baseSequenceId, changeset) {
    return Q.fcall(_.bind(function () {
      this._store.get(key).commit(baseSequenceId, changeset, this);
    }, this));
  }
}, EventEmitter.prototype);

module.exports = MockAdapter;
