"use strict";

var assert = require("assert");
var _ = require("underscore");

var Strategy = require("../../src/client/Strategy").Strategy;
var Revision = require("../../src/core/Revision");
var MockAdapter = require("../../src/client/adapters/Mock");

describe("Strategy", function () {
  describe("constructor", function () {
    it("should store all arguments", function () {
      var key = "woot", adapter = new MockAdapter(), revision = new Revision();
      var strategy = new Strategy(key, adapter, revision);

      assert.equal(strategy.getKey(), key);
      assert.equal(strategy.getAdapter(), adapter);
      assert.equal(strategy.getRevision(), revision);
    });
  });

  describe("#isEqualTo", function () {
    var origAdapterRef = new MockAdapter();
    var one = new Strategy("woot", origAdapterRef, new Revision());
    var two = _.clone(one);

    it("should succeed on identical shallow clone", function () {
      assert(one !== two);
      assert(one.isEqualTo(two));
      assert(two.isEqualTo(one));
    });

    it("should fail on different key", function () {
      var diffKey = new Strategy("hello", new MockAdapter(), new Revision());
      assert(!one.isEqualTo(diffKey));
    });

    it("should fail on different adapter reference", function () {
      var diffAdapterRef = new Strategy("woot", new MockAdapter(), new Revision());
      assert(!one.isEqualTo(diffAdapterRef));
    });

    it("should fail on different revision", function () {
      var diffRevision = new Strategy("woot", origAdapterRef, new Revision(1));
      assert(!one.isEqualTo(diffRevision));
    });
  });
});