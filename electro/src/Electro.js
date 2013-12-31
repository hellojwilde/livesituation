"use strict";

var _ = require("underscore");

var Client = require("./client/Client");

var Electro = {
  createClient: function (customOptions) {
    var options = _.extend({
      adapter: this.adapters.Node
    }, customOptions);
    
    var AdapterType = options.adapter;
    return new Client(new AdapterType(options));
  }
};

module.exports = Electro;