"use strict";

var assert = require("assert");

var MockDocument = require("../../src/mock/Document");
var MockAdapter = require("../../src/mock/Adapter");
var MockStore = require("../../src/mock/Store");
var Client = require("../../src/client/Client");

describe("Client", function () {
  describe("#get", function () {
    var doc = new MockDocument({ woot: "true" });
    var adapter = new MockAdapter(new MockStore({ "hello": doc }));
    var client = new Client(adapter);

    it("should retrieve latest and subscribe", function (done) {
      client.get("hello").then(function () {
        done();
      }, done);
    });
  });
});