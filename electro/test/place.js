var {Place} = require("../lib/place.js");
var assert = require("assert");

describe("Place", function () {
  describe("#isEqualTo", function () {
    it("should reject places of different lengths", function () {
      assert(!Place.isEqualTo([1, 2], []));
      assert(!Place.isEqualTo([1, 2], [1]));
      assert(!Place.isEqualTo([1], [1, 2]));
      assert(!Place.isEqualTo([], [1]));
    });

    it("should accept places of different types", function () {
      assert(Place.isEqualTo([], []));
      assert(Place.isEqualTo([1], [1]));
      assert(Place.isEqualTo([1, "woot"], [1, "woot"]));
    });
  }); 

  describe("#isAncestorOf", function () {
    it("should reject equal locations", function () {
      assert(!Place.isAncestorOf([], []), "empty places");
      assert(!Place.isAncestorOf([1, 2, 3], [1, 2, 3]), "nested arrays");
      assert(!Place.isAncestorOf(["woot"], ["woot"]), "object key");
    });

    it("should accept empty place as universal ancestor", function () {
      assert(Place.isAncestorOf([], [1, 2, 3]), "nested arrays");
      assert(Place.isAncestorOf([], [1]), "array");
      assert(Place.isAncestorOf([], [1, "woot"]), "array and object");
    });

    it("should accept parent/children", function () {
      assert(Place.isAncestorOf([1], [1, 2]), "parent/child");
      assert(Place.isAncestorOf([1, 2], [1, 2, 3]), "deeper parent/child");
      assert(!Place.isAncestorOf(["1"], [1, 2]), "types differentated");
    });

    it("should accept grandchildren", function () {
      assert(Place.isAncestorOf([1], [1, 2, 3]), "grandchildren");
    });

    it("should reject siblings", function () {
      assert(!Place.isAncestorOf([1, 2], [1, 3]), "array siblings");
      assert(!Place.isAncestorOf([1, "hello"], [1, "hi"]), "object siblings");
    });

    it("should reject grandchildren of siblings", function () {
      assert(!Place.isAncestorOf([1, 2], [1, 3, 2]), "array siblings");
      assert(!Place.isAncestorOf([1, "hey"], [1, "hi", 1]), "object siblings");
    });
  });

  describe("#getParent", function () {
    it("should respect ancestry algebra", function () {
      var place = ["woot", "hello", "hi"];
      var parent = Place.getParent(place);

      assert.deepEqual(parent, ["woot", "hello"], "parent is as expected");
      assert(Place.isAncestorOf(parent, place), "parent is ancestor");
    });

    it("should return universal ancestor on universal ancestor", function () {
      assert.deepEqual(Place.getParent([]), [])
    });
  });

  describe("#getHere", function () {
    it("should return last item of a sane array", function () {
      var place = ["woot", "hello", "hi"];
      assert.equal(Place.getHere(place), "hi");
    });

    it("should return null on universal ancestor", function () {
      assert.strictEqual(Place.getHere([]), null);
    });
  });

  describe("#getBranch", function () {
    it("should reject if place is not ancestor of childPlace", function () {
      var [offset, after] = Place.getBranch([1], [2]);
      assert.equal(offset, null, "offset is null");
      assert.deepEqual(after, [], "after is empty");
    });

    it("should return branching point if places are siblings", function () {
      var [offset, after] = Place.getBranch([1], [1]);
      assert.equal(offset, 1, "offset is 1");
      assert.deepEqual(after, [], "after is empty");
    });

    it("should return offset if child", function () {
      var [offset, after] = Place.getBranch([1], [1, 2]);
      assert.equal(offset, 1, "offset is 1");
      assert.deepEqual(after, [2], "after contains 2 after the branch point");
    });
  });

  describe("#fromFragments", function () {
    it("should assemble array fragments", function () {
      assert.deepEqual(Place.fromFragments([1], [2]), [1, 2]);
      assert.deepEqual(Place.fromFragments([1, 2], [2]), [1, 2, 2]);
    });

    it("should assemble offset and array fragments", function () {
      assert.deepEqual(Place.fromFragments(1, [2]), [1, 2]);
      assert.deepEqual(Place.fromFragments([1, 2], 2), [1, 2, 2]);
      assert.deepEqual(Place.fromFragments(1, 2, 2), [1, 2, 2]);
    });

    it("should respect ancestry algebra", function () {
      var place = ["hola", "hello", "hi"];
      var replace = Place.fromFragments(
        Place.getParent(place), Place.getHere(place));
      assert(Place.isEqualTo(place, replace));
    });
  });

  describe("#getValueAt", function () {
    it("should return all data on universal ancestor", function () {
      var obj = { hello: "woot", tinker: { when: "always" } };
      var arr = [[1, 2, 3], 1, 3];
      assert.deepEqual(Place.getValueAt([], obj), obj);
      assert.deepEqual(Place.getValueAt([], arr), arr);
    });

    it("should find parts of objects with string keys", function () {
      var obj = { hello: "woot", tinker: { when: "always" } };
      assert.equal(Place.getValueAt(["hello"], obj), "woot");
      assert.deepEqual(Place.getValueAt(["tinker"], obj), { when: "always" });
      assert.deepEqual(Place.getValueAt(["tinker", "when"], obj), "always");
    });

    it("should find items in arrays with numbers", function () {
      var arr = [[1, 2, 3], 1, 3];
      assert.equal(Place.getValueAt([1], arr), 1);
      assert.deepEqual(Place.getValueAt([0], arr), [1, 2, 3]);
      assert.equal(Place.getValueAt([0, 1], arr), 2);
    });

    it("should find items with mixed arrays and objects", function () {
      var obj = { hello: "woot", tinker: [{ when: "always" }] };
      assert.equal(Place.getValueAt(["tinker", 0, "when"], obj), "always");
    });

    it("should return undefined when traversing noncollections", function () {
      var obj = { hello: "woot", tinker: [{ when: "always" }] };
      assert.equal(Place.getValueAt(["tinker", 0, "when", 2], obj), undefined);
      assert.equal(Place.getValueAt(["wat", 0, "when", 2], obj), undefined);
    });
  });
});
