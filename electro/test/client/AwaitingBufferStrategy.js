"use strict";

var assert = require("assert");
var _ = require("underscore");

var Strategy = require("../../src/client/Strategy");
var Revision = require("../../src/core/Revision");
var Place = require("../../src/core/Place");
var Change = require("../../src/core/Change");
var Changeset = require("../../src/core/Changeset");
var MockAdapter = require("../../src/client/adapters/Mock");

var SyncedStrategy = Strategy.SyncedStrategy;
var AwaitingStrategy = Strategy.AwaitingStrategy;
var AwaitingBufferStrategy = Strategy.AwaitingBufferStrategy;

describe("AwaitingBufferStrategy", function () {
  var adapterRef = new MockAdapter();
  var revisionRef = new Revision();

  var changeset = new Changeset([new Change.ObjectChange(
    Change.Type.Insert, new Place(["woot"]), ["there it is"])]);
  var changeset2 = new Changeset([new Change.ObjectChange(
    Change.Type.Insert, new Place(["woot2"]), ["there it is"])]);
  var changeset3 = new Changeset([new Change.ObjectChange(
    Change.Type.Insert, new Place(["woot3"]), ["there it is"])]);

  var strategy = new AwaitingBufferStrategy(
    "woot", adapterRef, revisionRef, changeset, changeset2);

  describe("constructor", function () {
    it("should pass through unconfirmed, buffer, and revision", function () {
      var applied = changeset2.apply(changeset.apply(revisionRef));
      assert.equal(strategy.getBuffer(), changeset2);
      assert(strategy.getRevision().isEqualTo(applied));
    });
  });

  describe("#isEqualTo", function () {
    it("should accept shallow copies", function () {
      var copy = _.clone(strategy);
      assert(copy !== strategy);
      assert(copy.isEqualTo(strategy));
      assert(strategy.isEqualTo(copy));
    });
  });

  describe("#ack", function () {
    var newStrategy = strategy.ack();

    it("should create new AwaitingStrategy", function () {
      assert(newStrategy instanceof AwaitingStrategy);
      assert.equal(newStrategy.getKey(), "woot");
      assert.equal(newStrategy.getAdapter(), adapterRef);
    });

    it("ack(strategy).revision == strategy.revision", function () {
      assert(newStrategy.getRevision().isEqualTo(strategy.getRevision()));
    });
  });

  describe("#commitServer", function () {
    var newStrategy = strategy.commitServer(changeset3);

    it("should create new AwaitingStrategy", function () {
      assert(newStrategy instanceof AwaitingBufferStrategy);
      assert.equal(newStrategy.getKey(), "woot");
      assert.equal(newStrategy.getAdapter(), adapterRef);
      assert(newStrategy.getUnconfirmed().isEqualTo(
        changeset3.transform(changeset)));
    });
  });

  describe("#commitClient", function () {
    var newStrategy = strategy.commitClient(changeset3);

    it("should create new AwaitingBufferStrategy", function () {
      assert(newStrategy instanceof AwaitingBufferStrategy);
      assert.equal(newStrategy.getKey(), "woot");
      assert.equal(newStrategy.getAdapter(), adapterRef);
      assert(newStrategy.getBuffer(), changeset2.concat(changeset3));
    });
  });

  it("commitClient(s).revision == commitServer(s).revision", function () {
    var serverStrategy = strategy.commitServer(changeset3);
    var clientStrategy = strategy.commitClient(changeset3);
    assert.deepEqual(serverStrategy.getRevision().getData(),
                     clientStrategy.getRevision().getData());
  });
});
