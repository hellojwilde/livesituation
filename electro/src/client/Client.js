"use strict";

var View = require("./View");
var State = require("./State");

/**
 * Frontend for querying, creating, and deleting entire documents, 
 * given a compliant Electro adapter instance.
 * 
 * @constructor
 * @param {Object} adapter Instance of an adapter.
 */
function Client(adapter) {
  this._adapter = adapter;
}

Client.prototype = {
  /**
   * Asynchronously retrieves all of the keys for documents in the store.
   * 
   * @return {Promise} Promise that accepts with an array of document keys. 
   */
  getKeys: function () { 
    return this._adapter.getKeys(); 
  },
  
  /**
   * Asynchronously retrieves a live-updating document {@link View} 
   * for the given document key.
   * 
   * @param  {String}  key
   * @return {Promise} Promise that accepts with a Fragment.
   */
  get: function (key) {
    var adapter = this._adapter;
    return adapter.getLatest(key)
      .then(function (revision) {
        return adapter.subscribe(key, revision.getSequenceId())
          .then(function () {
            return new View(new State(key, adapter, revision));
          });
      });
  },

  /**
   * Asynchronously creates a document with the specified key and initial data.
   * 
   * @param  {String}  key
   * @param  {Object}  data Initial data. Must be acyclic JSON-serializable 
   *                        Array or Object.
   * @return {Promise}      Promise that accepts if created successfully.
   */
  create: function (key, data) { 
    return this._adapter.create(key, data); 
  },

  /**
   * Asynchronously removes the document with the specified key.
   * 
   * @param  {String}  key
   * @return {Promise}     Promise that accepts if document was removed.
   */
  remove: function (key) { 
    return this._adapter.remove(key); 
  }
};

module.exports = Client;
