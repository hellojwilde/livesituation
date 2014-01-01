"use strict";

var _ = require("underscore");

var Client = require("./client/Client");
var MockAdapter = require("./mock/Adapter");
var MockDocument = require("./mock/Document");
var MockStore = require("./mock/Store");

var Electro = {
  Client: Client,

  MockAdapter: MockAdapter,
  MockDocument: MockDocument,
  MockStore: MockStore
};

module.exports = Electro;