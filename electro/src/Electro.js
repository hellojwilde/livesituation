"use strict";

var _ = require("underscore");

var Client = require("./client/Client");
var Document = require("./store/Document");
var Store = require("./store/Store");

var MockAdapter = require("./client/adapters/Mock");

var Electro = {
  Client: Client,
  Document: Document,
  Store: Store,

  MockAdapter: MockAdapter
};

module.exports = Electro;