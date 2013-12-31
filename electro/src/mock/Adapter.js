"use strict";

var Q = require("q");
var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;

var MockDocument = require("./Document");

function MockAdapter (docs) {
  EventEmitter.call(this);

  this._docs = docs || {};
  this._clientId = _.uniqueId();
}

MockAdapter.prototype = {
  getKeys: function () { 
    return Q.fcall(_.bind(function () { 
      return _.keys(this._docs); 
    }, this)); 
  },

  getLatest: function (key) { 
    return Q.fcall(_.bind(function () { 
      return this._getDoc(key).getLatest(); 
    }, this)); 
  },

  create: function (key, data) {
    return Q.fcall(_.bind(function () { 
      if (!_.isUndefined(this._docs[key]))
        throw new Error("Document with that key already exists.");
      this._docs[key] = new MockDocument(data);
    }, this));
  },

  commit: function (key, baseSequenceId, changeset) {
    return Q.fcall(_.bind(function () {
      return this._getDoc(key).commit(baseSequenceId, changeset);
    }, this));
  },

  remove: function (key) {
    return Q.fcall(_.bind(function () {
      this._getDoc(key);
      delete this._docs[key];
    }, this));
  },

  subscribe: function (key) {
    return Q.fcall(_.bind(function () { 
      this._getDoc(key).subscribe(this._clientId);
    }, this));
  },

  isSubscribed: function (key) {
    return Q.fcall(_.bind(function () {
      return this._getDoc(key).isSubscribed(this._clientId);
    }, this));
  },

  getSubscribers: function (key) {
    return Q.fcall(_.bind(function () {
      return this._getDoc(key).getSubscribers();
    }, this));
  },

  _getDoc: function (key) {
    console.log(key);
    var doc = this._docs[key];
    if (_.isUndefined(doc))
      throw new Error("Document with that key does not exist.");
    return doc;
  }
};

module.exports = MockAdapter;