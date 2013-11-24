var {Place} = require("../../lib/place");
var {ObjectChange} = require("../../lib/change");
var assert = require("assert");
var testing = require("../testing");

describe("ObjectChange", function () {
  describe("-type", function () {
    it("should return object", function () {
      var change = new ObjectChange("insert", new Place(["mykey"], "ins"));
      assert.equal(change.type, "object");
    });
  });

  describe("-inverted", function () {
    describe("insert/remove", function () {
      it("should flip insert to remove", function () {
        var change = new ObjectChange("insert", new Place(["mykey"]), "ins");
        assert.equal(change.inverted.op, "remove");
      });
    });

    describe("replace", function () {
      it("should flip order of before and after", function () {
        var change = new ObjectChange("replace", new Place(["k"]), "b", "a");
        assert.deepEqual(change.inverted.args, ["a", "b"]);
      });
    });

    it("should satisfy change = invert(invert(change))", function () {
      var insert = new ObjectChange("insert", new Place(["k"]), "i");
      var remove = new ObjectChange("remove", new Place(["k"]), "i");
      var replace = new ObjectChange("replace", new Place(["k"]), "b", "a");

      testing.assertChangeEqual(insert, insert.inverted.inverted, "insert");
      testing.assertChangeEqual(remove, remove.inverted.inverted, "remove");
      testing.assertChangeEqual(replace, replace.inverted.inverted, "replace");
    });
  });

  describe("#relocate", function () {
    it("should invalidate children", function () {
      var insert = new ObjectChange("insert", new Place(["k", "j"]), "i");
      var toRelocate = new Place(["k", "j", 1]);
      var anotherToRelocate = new Place(["k", "j", "l", "woot"]);

      assert.equal(insert.relocate(toRelocate), null);
      assert.equal(insert.relocate(anotherToRelocate), null);
    });

    it("should not invalidate same reference or other branches", function () {
      var insert = new ObjectChange("insert", new Place(["k", "j"]), "i");
      var toRelocate = new Place(["k", "j"]);
      var anotherToRelocate = new Place(["b", "j", "l", "woot"]);
      assert(insert.relocate(toRelocate).isEqualTo(toRelocate));
      assert(insert.relocate(anotherToRelocate).isEqualTo(anotherToRelocate));
    });
  });

  describe("#mutate", function () {
    it("should remove the relevant element", function () {
      var remove = new ObjectChange("remove", new Place(["k"]), "w");
      var ctx = {"k": "w", "h": "t"};
      assert.deepEqual(remove.mutate(ctx), {"h":"t"});
    });

    it("should set the relevant element", function () {
      var insert = new ObjectChange("insert", new Place(["k"]), "w");
      var replace = new ObjectChange("replace", new Place(["j", "l"]), "i", "f");
      var ctx = {"j": {"l": "i"}};
      assert.deepEqual(insert.mutate(ctx), {"j": {"l": "i"}, "k": "w"});
      assert.deepEqual(replace.mutate(ctx), {"j": {"l": "f"}, "k": "w"});
    });
  });
});