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

function MockAdapter (store) {
  EventEmitter.call(this);
  this._store = store;
}

MockAdapter.prototype = {
  getKeys: proxyStoreMethod("getKeys"),

  create: proxyStoreMethod("create"),
  remove: proxyStoreMethod("remove"),

  getLatest: proxyDocumentMethod("getLatest"),
  getSubscribers: proxyDocumentMethod("getSubscribers"),
  isSubscribed: proxyDocumentMethod("isSubscribed"),

  subscribe: proxyDocumentMethod("subscribe"),
  commit: function (key, baseSequenceId, changeset) {
    return Q.fcall(_.bind(function () {
      this._store.get(key).commit(baseSequenceId, changeset, this);
    }, this));
  }
};

module.exports = MockAdapter;
