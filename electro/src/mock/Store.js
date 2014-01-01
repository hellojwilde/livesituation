"use strict";

var _ = require("underscore");
var MockDocument = require("./Document");

function MockStore(docs) {
  this._docs = docs || {};
}

MockStore.prototype = {
  getKeys: function () { 
    return _.keys(this._docs); 
  },

  get: function (key) { 
    return this._docs[key]; 
  },

  create: function (key, initialData) { 
    if (_.has(this._docs, key)) 
      throw new Error("document already exists.");
    this._docs[key] = new MockDocument(initialData);
  },

  remove: function (key) { 
    delete this._docs[key]; 
  }
};

module.exports = MockStore;
