var assert = require("assert");

module.exports = {
  assertChangeEqual: function (change1, change2, name) {
    assert.equal(change1.constructor, change2.constructor, name + ": class");
    assert.equal(change1.op, change2.op, name + ": op");
    assert(change1.place.isEqualTo(change2.place), name + ": place");
    assert.deepEqual(change1.args, change2.args, name + ": args");
  }
}