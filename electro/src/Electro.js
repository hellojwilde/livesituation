"use strict";

var _ = require("underscore");

var Client = require("./client/Client");
var MockAdapter = require("./client/adapters/Mock");
var Document = require("./store/Document");
var Store = require("./store/Store");

var Electro = {
  Client: Client,
  Document: Document,
  Store: Store,

  MockAdapter: MockAdapter
};

module.exports = Electro;