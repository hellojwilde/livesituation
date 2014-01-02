"use strict";

var assert = require("assert");
var _ = require("underscore");

var Place = require("../../src/core/Place");
var Change = require("../../src/core/Change");
var AbstractChange = Change.Change, Type = Change.Type;

describe("Change", function () {
  describe("constructor", function () {
    it("should store all arguments", function () {
      var parentType = "arbitrary";
      var type = Type.Insert, place = new Place(), args = "hello";
      var change = new AbstractChange(parentType, type, place, args);
      assert.equal(change.getParentType(), parentType);
      assert.equal(change.getType(), type);
      assert.equal(change.getPlace(), place);
      assert.equal(change.getArgs(), args);
    });
  });
  
  describe("isEqualTo", function () {
    it("should compare by value", function () {
      var first = new AbstractChange("arb", Type.Insert, new Place(), "hi");
      var second = _.clone(first);
      assert.notEqual(first, second);
      assert(first.isEqualTo(second));
      assert(second.isEqualTo(first));
    });
  });
});