"use strict";

var assert = require("assert");

var MockAdapter = require("../../../src/client/adapters/Mock");
var Store = require("../../../src/store/Store");
var Document = require("../../../src/store/Document");

describe("MockAdapter", function () {
  var doc = new Document();
  var adapter = new MockAdapter(new Store({ "hello": doc }));

  describe("#getKeys", function () {
    it("should return keys in intialization", function (done) {
      adapter.getKeys().then(function (keys) {
        assert.deepEqual(keys, ["hello"]);
        done();
      }).then(null, done);
    });
  });

  describe("#getLatest", function () {
    it("should return latest revision", function (done) {
      adapter.getLatest("hello").then(function (latest) {
        assert.deepEqual(latest.getData(), {});
        assert.equal(latest.getSequenceId(), 0);
        done();
      }).then(null, done);
    })
  });
});