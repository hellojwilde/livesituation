"use strict";

var Store = require("./client/Store");
var AppEngineAdapter = require("./adapters/AppEngineAdapter");

var Electro = {
  Store: Store,
  adapters: { AppEngineAdapter }
};

module.exports = Electro;