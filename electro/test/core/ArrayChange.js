"use strict";

var assert = require("assert");
var _ = require("underscore");

var Place = require("../../src/core/Place");
var Change = require("../../src/core/Change");
var ArrayChange = Change.ArrayChange, ChangeType = Change.ChangeType;

describe("ArrayChange", function () {
  describe("#getInverted", function () {
    describe("insert & remove", function () {
      it("invert(insert) -> remove", function () {
        var change = new ArrayChange(ChangeType.Insert, new Place());
        assert.equal(change.getInversion().getType(), ChangeType.Remove);
      });
      
      it("invert(remove) -> insert", function () {
        var change = new ArrayChange(ChangeType.Remove, new Place());
        assert.equal(change.getInversion().getType(), ChangeType.Insert);
      });
    });

    describe("replace", function () {
      it("invert(<before, after>) -> <after, before>", function () {
        var change = new ArrayChange(ChangeType.Replace, null, ["b", "a"]);
        assert.deepEqual(change.getInversion().getArgs(), ["a", "b"]);
      });
    });

    describe("move", function () {
      it("invert(<...old, new>) -> <...new, old>", function () {
        var change = new ArrayChange(ChangeType.Move, new Place(["k", 0]), [3]);
        var inv = change.getInversion();
        assert.equal(inv.getPlace().getOffset(), _.first(change.getArgs()));
        assert.equal(_.first(inv.getArgs()), change.getPlace().getOffset());
      });
    });
  });

  describe("#relocate", function () {
    describe("insert & remove", function () {
      it("should not affect place before a change", function () {
        var toRelocate = new Place(["k", 0]);
        var insert = new ArrayChange("insert", new Place(["k", 5]), "i");
        var remove = new ArrayChange("remove", new Place(["k", 5]), "i");

        assert(insert.relocate(toRelocate).isEqualTo(toRelocate), "insert");
        assert(remove.relocate(toRelocate).isEqualTo(toRelocate), "remove")
      });

      it("should nudge place after insert forward", function () {
        var toRelocate = new Place(["k", 5]);
        var expectedRelocation = new Place(["k", 6]);
        var change = new ArrayChange("insert", toRelocate, "hi");
        assert(change.relocate(toRelocate).isEqualTo(expectedRelocation));
      });

      it("should nudge place after remove backward", function () {
        var toRelocate = new Place(["k", 5]);
        var expectedRelocation = new Place(["k", 4]);
        var change = new ArrayChange("remove", toRelocate, "hi");
        assert(change.relocate(toRelocate).isEqualTo(expectedRelocation));
      });
    });

    describe("replace", function () {
      it("should invalidate children", function () {
        var replace = new ArrayChange("replace", new Place(["k", 0]), "hi");
        var toRelocate = new Place(["k", 0, 1]);
        assert.equal(replace.relocate(toRelocate), null);
      });

      it("should not invalidate same reference or other branches", function () {
        var replace = new ArrayChange("replace", new Place(["k", 0]), "hi");
        var toRelocate = new Place(["k", 0]);
        var otherToRelocate = new Place(["b"]);
        assert(replace.relocate(toRelocate).isEqualTo(toRelocate), "same");
        assert(replace.relocate(otherToRelocate).isEqualTo(otherToRelocate), "other branch");
      });
    });

    describe("move", function () {
      it("should not bother places entirely above/below", function () {
        var move = new ArrayChange("move", new Place(["k", 1]), [5]);
        var above = new Place(["k", 0]);
        var below = new Place(["k", 6]);
        assert(move.relocate(above).isEqualTo(above), "above");
        assert(move.relocate(below).isEqualTo(below), "below");
      });

      it("should shift items in range up when moving down", function () {
        var move = new ArrayChange("move", new Place(["k", 1]), [5]);
        var inRange = new Place(["k", 2]);
        var expected = new Place(["k", 1]);
        assert(move.relocate(inRange).isEqualTo(expected));
      });

      it("should shift items in range down when moving up", function () {
        var move = new ArrayChange("move", new Place(["k", 5]), [1]);
        var inRange = new Place(["k", 2]);
        var expected = new Place(["k", 3]);
        assert(move.relocate(inRange).isEqualTo(expected));
      });

      it("should not bother unrelated places", function () {
        var move = new ArrayChange("move", new Place(["k", 5]), [1]);
        var inRangeSorta = new Place(["j", 2]);
        assert(move.relocate(inRangeSorta).isEqualTo(inRangeSorta));
      });
      
      it("should shift items that are direct children", function () {
        var move = new ArrayChange("move", new Place(["k", 5]), [1]);
        var inRange = new Place(["k", 5]);
        var expected = new Place(["k", 1]);
        assert(move.relocate(inRange).isEqualTo(expected));
      });
    });
  });

  describe("#mutate", function () {
    describe("insert/remove", function () {
      it("should insert at appropriate location", function () {
        var insert = new ArrayChange("insert", new Place([1]), [2]);
        var ctx = [1, 3, 4];
        assert.deepEqual(insert.mutate(ctx), [1, 2, 3, 4]);
      });

      it("should remove from appropriate location", function () {
        var remove = new ArrayChange("remove", new Place([3, 0]), [4]);
        var ctx = [1, 3, 4, [4, 5]];
        assert.deepEqual(remove.mutate(ctx), [1, 3, 4, [5]]);
      });

      it("should satisfy data = m(i(change), m(change, data))", function () {
        var orig = new ArrayChange("insert", new Place([1]), [2]);
        var ctx = [1, 3, 4];
        var inv = orig.getInversion();
        assert.deepEqual(inv.mutate(orig.mutate(ctx)), [1, 3, 4]);
      });
    });

    describe("replace", function () {
      it("should replace at expected location", function () {
        var replace = new ArrayChange("replace", new Place([1]), ["w", "o"]);
        var ctx = ["w", "w", "o", "t"];
        assert.deepEqual(replace.mutate(ctx), ["w", "o", "o", "t"]);
      });

      it("should satisfy data = m(i(change), m(change, data))", function () {
        var orig = new ArrayChange("replace", new Place([1]), ["w", "o"]);
        var ctx = ["w", "w", "o", "t"];
        var inv = orig.getInversion()
        assert.deepEqual(inv.mutate(orig.mutate(ctx)), ["w", "w", "o", "t"]);
      });
    });

    describe("move", function () {
      it("should move downward at expected locations", function () {
        var move = new ArrayChange("move", new Place([0]), [3]);
        var ctx = [1, 2, 3, 4, 5];
        assert.deepEqual(move.mutate(ctx), [2, 3, 4, 1, 5]);
      });

      it("should move upward at expected locations", function () {
        var move = new ArrayChange("move", new Place([4]), [0]);
        var ctx = [1, 2, 3, 4, 5];
        assert.deepEqual(move.mutate(ctx), [5, 1, 2, 3, 4]);
      });

      it("should satisfy data = m(i(change), m(change, data))", function () {
        var orig = new ArrayChange("move", new Place([4]), [0]);
        var ctx = [1, 2, 3, 4, 5];
        var inv = orig.getInversion();
        assert.deepEqual(inv.mutate(orig.mutate(ctx)), [1, 2, 3, 4, 5]);
      });
    });
  });
});
