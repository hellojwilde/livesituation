var assert = require("assert");

var Place = require("../../src/core/Place");
var Change = require("../../src/core/Change");
var StringChange = Change.StringChange, ChangeType = Change.ChangeType;

describe("StringChange", function () {
  describe("#getInversion", function () {
    it("invert(insert) -> remove", function () {
      var change = new StringChange(ChangeType.Insert, new Place(), "ins");
      assert.equal(change.getInversion().getType(), ChangeType.Remove);
    });
    
    it("invert(remove) -> insert", function () {
      var change = new StringChange(ChangeType.Remove, new Place(), "ins");
      assert.equal(change.getInversion().getType(), ChangeType.Insert);
    });
  });

  describe("#relocate", function () {
    it("should nudge place after insert forward", function () {
      var toRelocate = new Place(["k", 5]);
      var expectedRelocation = new Place(["k", 7]);
      var change = new StringChange(ChangeType.Insert, toRelocate, ["hi"]);
      assert(change.relocate(toRelocate).isEqualTo(expectedRelocation));
    });

    it("should nudge place after remove backward", function () {
      var toRelocate = new Place(["k", 5]);
      var expectedRelocation = new Place(["k", 3]);
      var change = new StringChange(ChangeType.Remove, toRelocate, ["hi"]);
      assert(change.relocate(toRelocate).isEqualTo(expectedRelocation));
    });

    it("should not affect place before an operation", function () {
      var toRelocate = new Place(["k", 0]);
      var insert = new StringChange(ChangeType.Insert, new Place(["k", 5]), ["i"]);
      var remove = new StringChange(ChangeType.Remove, new Place(["k", 5]), "i");

      assert(insert.relocate(toRelocate).isEqualTo(toRelocate), ChangeType.Insert);
      assert(remove.relocate(toRelocate).isEqualTo(toRelocate), ChangeType.Remove)
    });
  });

  describe("#mutate", function () {
    it("should insert a string at the location", function () {
      var insert = new StringChange("insert", new Place(["str", 2]), ["i"]);
      var ctx = { str: "hello" };
      assert.deepEqual(insert.mutate(ctx), { str: "heillo" });
    });

    it("should remove a string at the location", function () {
      var remove = new StringChange("remove", new Place(["str", 1]), ["ooo"]);
      var ctx = { str: "wooooot" };
      assert.deepEqual(remove.mutate(ctx), { str: "woot" });
    });

    it("should satisfy data = m(i(change), m(change, data))", function () {
      var orig = new StringChange("insert", new Place(["str", 2]), ["i"]);
      var ctx = { str: "hello" };
      var inv = orig.getInversion()
      assert.deepEqual(inv.mutate(orig.mutate(ctx)), {str: "hello"});
    });
  });
});
