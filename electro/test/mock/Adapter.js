"use strict";

var assert = require("assert");
var MockStore = require("../../src/mock/Store");
var MockAdapter = require("../../src/mock/Adapter");
var MockDocument = require("../../src/mock/Document");

describe("MockAdapter", function () {
  var doc = new MockDocument();
  var adapter = new MockAdapter(new MockStore({ "hello": doc }));

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