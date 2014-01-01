"use strict";

var _ = require("underscore");
var Document = require("./Document");

function Store(docs) {
  this._docs = docs || {};
}

Store.prototype = {
  getKeys: function () { 
    return _.keys(this._docs); 
  },

  get: function (key) { 
    return this._docs[key]; 
  },

  create: function (key, initialData) { 
    if (_.has(this._docs, key)) 
      throw new Error("document already exists.");
    this._docs[key] = new Document(initialData);
  },

  remove: function (key) { 
    delete this._docs[key]; 
  }
};

module.exports = Store;
