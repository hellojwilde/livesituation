"use strict";

var _ = require("underscore");

var Client = require("./client/Client");
var AppEngineAdapter = require("./client/adapters/AppEngine");
var NodeAdapter = require("./client/adapters/Node");

var Electro = {
  createClient: function (customOptions) {
    var options = _.extend({
      adapter: this.adapters.Node
    }, customOptions);
    
    var AdapterType = options.adapter;
    return new Client(new AdapterType(options));
  },
  
  adapters: {
    AppEngine: AppEngineAdapter,
    Node: NodeAdapter
  }
};

module.exports = Electro;