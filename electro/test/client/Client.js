"use strict";

var assert = require("assert");

var Client = require("../../src/client/Client");
var MockAdapter = require("../../src/client/adapters/Mock");
var Document = require("../../src/store/Document");
var Store = require("../../src/store/Store");

describe("Client", function () {
  describe("#get", function () {
    var doc = new Document({ woot: "true" });
    var adapter = new MockAdapter(new Store({ "hello": doc }));
    var client = new Client(adapter);

    it("should retrieve latest and subscribe", function (done) {
      client.get("hello").then(function () {
        done();
      }, done);
    });
  });
});