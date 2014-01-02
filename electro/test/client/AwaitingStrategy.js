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

describe("AwaitingStrategy", function () {
  var adapterRef = new MockAdapter();
  var revisionRef = new Revision();
  var changeset = new Changeset([new Change.ObjectChange(
    Change.Type.Insert, new Place(["woot"]), ["there it is"])]);
  var changeset2 = new Changeset([new Change.ObjectChange(
    Change.Type.Insert, new Place(["woot2"]), ["there it is"])]);

  var strategy = new AwaitingStrategy("woot", adapterRef, revisionRef, 
    changeset);

  describe("constructor", function () {
    it("should pass through unconfirmed and revision", function () {
      var applied = changeset.apply(revisionRef);
      assert.equal(strategy.getUnconfirmed(), changeset);
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

    it("should create new SyncedStrategy", function () {
      assert(newStrategy instanceof SyncedStrategy);
      assert.equal(newStrategy.getKey(), "woot");
      assert.equal(newStrategy.getAdapter(), adapterRef);
    });

    it("ack(strategy).revision == strategy.revision", function () {
      assert(newStrategy.getRevision().isEqualTo(strategy.getRevision()));
    });
  });

  describe("#commitServer", function () {
    var newStrategy = strategy.commitServer(changeset2);

    it("should create new AwaitingStrategy", function () {
      assert(newStrategy instanceof AwaitingStrategy);
      assert.equal(newStrategy.getKey(), "woot");
      assert.equal(newStrategy.getAdapter(), adapterRef);
      assert(newStrategy.getUnconfirmed().isEqualTo(
        changeset2.transform(changeset)));
    });
  });

  describe("#commitClient", function () {
    var newStrategy = strategy.commitClient(changeset2);

    it("should create new AwaitingBufferStrategy", function () {
      assert(newStrategy instanceof AwaitingBufferStrategy);
      assert.equal(newStrategy.getKey(), "woot");
      assert.equal(newStrategy.getAdapter(), adapterRef);
    });
  });

  it("commitClient(s).revision == commitServer(s).revision", function () {
    var serverStrategy = strategy.commitServer(changeset2);
    var clientStrategy = strategy.commitClient(changeset2);
    assert.deepEqual(serverStrategy.getRevision().getData(),
                     clientStrategy.getRevision().getData());
  });
});
