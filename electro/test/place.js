var {Place} = require("../lib/place");
var assert = require("assert");

describe("Place", function () {
  describe("-path", function () {
    it("should return whatever is passed in, [] if null", function () {
      assert.deepEqual(new Place([1, 2, 3]).path, [1, 2, 3]);
      assert.deepEqual(new Place().path, []);
    });
  });

  describe("-isRoot", function () {
    it("should return true iff universal ancestor", function () {
      assert(new Place().isRoot);
      assert(!new Place([1]).isRoot);
    });
  });

  describe("-parent", function () {
    it("should respect ancestry algebra", function () {
      var place = new Place(["woot", "hello", "hi"]);
      var parent = place.parent;

      assert.deepEqual(parent.path, ["woot", "hello"], "parent is as expected");
      assert(parent.isAncestorOf(place), "parent is ancestor");
    });

    it("should return universal ancestor on universal ancestor", function () {
      assert(new Place().parent.isRoot)
    });
  });

  describe("-offset", function () {
    it("should return last item of a sane array", function () {
      var place = new Place(["woot", "hello", "hi"]);
      assert.equal(place.offset, "hi");
    });

    it("should return null on universal ancestor", function () {
      assert.strictEqual(new Place().offset, null);
    });
  });

  describe("#isEqualTo", function () {
    it("should reject places of different lengths", function () {
      assert(!new Place([1, 2]).isEqualTo(new Place([])));
      assert(!new Place([1, 2]).isEqualTo(new Place([1])));
      assert(!new Place([1]).isEqualTo(new Place([1, 2])));
      assert(!new Place().isEqualTo(new Place([1])));
      assert(!new Place([]).isEqualTo(new Place([1])));
    });

    it("should accept places of different types", function () {
      assert(new Place().isEqualTo(new Place([])));
      assert(new Place([1]).isEqualTo(new Place([1])));
      assert(new Place([1, "woot"]).isEqualTo(new Place([1, "woot"])));
    });
  }); 

  describe("#isAncestorOf", function () {
    it("should reject equal locations", function () {
      assert(!new Place().isAncestorOf(new Place()), "empty places");
      assert(!new Place([1, 2, 3]).isAncestorOf(new Place([1, 2, 3])), "nested arrays");
      assert(!new Place(["woot"]).isAncestorOf(new Place(["woot"])), "object key");
    });

    it("should accept empty place as universal ancestor", function () {
      assert(new Place().isAncestorOf(new Place([1, 2, 3])), "nested arrays");
      assert(new Place().isAncestorOf(new Place([1])), "array");
      assert(new Place().isAncestorOf(new Place([1, "woot"])), "array and object");
    });

    it("should accept parent/children", function () {
      assert(new Place([1]).isAncestorOf(new Place([1, 2])), "parent/child");
      assert(new Place([1,2]).isAncestorOf(new Place([1, 2, 3])), "deeper parent/child");
      assert(!new Place(["1"]).isAncestorOf(new Place([1, 2])), "types differentated");
    });

    it("should accept grandchildren", function () {
      assert(new Place([1]).isAncestorOf(new Place([1, 2, 3])), "grandchildren");
    });

    it("should reject siblings", function () {
      assert(!new Place([1, 2]).isAncestorOf(new Place([1, 3])), "array siblings");
      assert(!new Place([1, "hello"]).isAncestorOf(new Place([1, "hi"])), "object siblings");
    });

    it("should reject grandchildren of siblings", function () {
      assert(!new Place([1, 2]).isAncestorOf(new Place([1, 3, 2])), "array siblings");
      assert(!new Place([1, "hey"]).isAncestorOf(new Place([1, "hi", 1])), "object siblings");
    });
  });

  describe("#getBranch", function () {
    it("should reject if place is not ancestor of childPlace", function () {
      var [offset, after] = new Place([1]).getBranch(new Place([2]));
      assert.equal(offset, null, "offset is null");
      assert(after.isEqualTo(new Place()), "after is empty");
    });

    it("should return branching point if places are siblings", function () {
      var [offset, after] = new Place([1]).getBranch(new Place([1]));
      assert.equal(offset, 1, "offset is 1");
      assert(after.isEqualTo(new Place()), "after is empty");
    });

    it("should return offset if child", function () {
      var [offset, after] = new Place([1]).getBranch(new Place([1, 2]));
      assert.equal(offset, 1, "offset is 1");
      assert(after.isEqualTo(new Place([2])), "after contains 2 after the branch point");
    });
  });

  describe("#getValueIn", function () {
    it("should return all data on universal ancestor", function () {
      var obj = { hello: "woot", tinker: { when: "always" } };
      var arr = [[1, 2, 3], 1, 3];
      assert.deepEqual(new Place().getValueIn(obj), obj);
      assert.deepEqual(new Place().getValueIn(arr), arr);
    });

    it("should find parts of objects with string keys", function () {
      var obj = { hello: "woot", tinker: { when: "always" } };
      assert.equal(new Place(["hello"]).getValueIn(obj), "woot");
      assert.deepEqual(new Place(["tinker"]).getValueIn(obj), { when: "always" });
      assert.deepEqual(new Place(["tinker", "when"]).getValueIn(obj), "always");
    });

    it("should find items in arrays with numbers", function () {
      var arr = [[1, 2, 3], 1, 3];
      assert.equal(new Place([1]).getValueIn(arr), 1);
      assert.deepEqual(new Place([0]).getValueIn(arr), [1, 2, 3]);
      assert.equal(new Place([0, 1]).getValueIn(arr), 2);
    });

    it("should find items with mixed arrays and objects", function () {
      var obj = { hello: "woot", tinker: [{ when: "always" }] };
      assert.equal(new Place(["tinker", 0, "when"]).getValueIn(obj), "always");
    });

    it("should return undefined when traversing noncollections", function () {
      var obj = { hello: "woot", tinker: [{ when: "always" }] };
      assert.equal(new Place(["tinker", 0, "when", 2]).getValueIn(obj), undefined);
      assert.equal(new Place(["wat", 0, "when", 2]).getValueIn(obj), undefined);
    });
  });

  describe("#concat", function () {
    it("should respect ancestry algebra", function () {
      var place = new Place([1, 2, 4]);
      var child = new Place([place.offset]);
      assert(place.isEqualTo(place.parent.concat(child)));
    })
  });

  describe(":fromFragments", function () {
    it("should assemble array fragments", function () {
      assert(Place.fromFragments(new Place([1]), new Place([2])).isEqualTo(new Place([1, 2])));
      assert(Place.fromFragments(new Place([1, 2]), new Place([2])).isEqualTo(new Place([1, 2, 2])));
    });
  });
});
