"use strict";

var assert = require("assert");

var Place = require("../../src/core/Place");
var Change = require("../../src/core/Change");
var ObjectChange = Change.ObjectChange, ChangeType = Change.ChangeType;


describe("ObjectChange", function () {
  describe("#getInversion", function () {
    describe("insert & remove", function () {
      it("invert(insert) -> remove", function () {
        var change = new ObjectChange(ChangeType.Insert, new Place(), "ins");
        assert.equal(change.getInversion().getType(), ChangeType.Remove);
      });
      
      it("invert(remove) -> insert", function () {
        var change = new ObjectChange(ChangeType.Remove, new Place(), "ins");
        assert.equal(change.getInversion().getType(), ChangeType.Insert);
      });
    });

    describe("replace", function () {
      it("invert(<before, after>) -> <after, before>", function () {
        var change = new ObjectChange(ChangeType.Replace, new Place(), ["b", "a"]);
        assert.deepEqual(change.getInversion().getArgs(), ["a", "b"]);
      });
    });
  });

  describe("#relocate", function () {
    it("should invalidate children", function () {
      var insert = new ObjectChange(ChangeType.Insert, new Place(["k", "j"]), ["i"]);
      var toRelocate = new Place(["k", "j", 1]);
      var anotherToRelocate = new Place(["k", "j", "l", "woot"]);

      assert.equal(insert.relocate(toRelocate), null);
      assert.equal(insert.relocate(anotherToRelocate), null);
    });

    it("should not invalidate same reference or other branches", function () {
      var insert = new ObjectChange(ChangeType.Insert, new Place(["k", "j"]), ["i"]);
      var toRelocate = new Place(["k", "j"]);
      var anotherToRelocate = new Place(["b", "j", "l", "woot"]);
      assert(insert.relocate(toRelocate).isEqualTo(toRelocate));
      assert(insert.relocate(anotherToRelocate).isEqualTo(anotherToRelocate));
    });
  });

  describe("#mutate", function () {
    it("should remove the relevant element", function () {
      var remove = new ObjectChange(ChangeType.Remove, new Place(["k"]), "w");
      var ctx = {"k": "w", "h": "t"};
      assert.deepEqual(remove.mutate(ctx), {"h":"t"});
    });

    it("should set the relevant element", function () {
      var insert = new ObjectChange(ChangeType.Insert, new Place(["k"]), "w");
      var replace = new ObjectChange(ChangeType.Replace, new Place(["j", "l"]), ["i", "f"]);
      var ctx = {"j": {"l": "i"}};
      assert.deepEqual(insert.mutate(ctx), {"j": {"l": "i"}, "k": "w"});
      assert.deepEqual(replace.mutate(ctx), {"j": {"l": "f"}, "k": "w"});
    });
  });
});
