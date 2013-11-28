"use strict";

class DocumentState {
  constructor(name, adapter, revision) {
    this._name = name;
    this._adapter = adapter;
    this._strategy = new Synced(name, adapter, revision);

    adapter.subscribe(name, revision, this._handleMessage);
  }

  get name() { return this._name; }
  get revision() { return this._strategy.revision; }

  commit(changeset) {
    this._applyStrategy("commit", changeset);
  }

  _handleMessage(message) {
    switch (message.type) {
      case "ack":
        this._applyStrategy("handleAck", message.data);
        break;
      case "commit":
        this._applyStrategy("handleCommit", message.data);
        break;
    }
  }

  _applyStrategy(method, ...args) {
    var strategy = this._strategy[method](this._name, this._adapter, ...args);
    if (strategy != this._strategy) this._strategy = strategy;
  }
}

class DocumentStateStrategy {
  constructor(revision) { 
    this._revision = revision; 
  }

  get revision() { return this._revision; }

  commit(changeset) { throw "Method not implemented."; }
  handleAck(id) { throw "Method not implemented."; }
  handleCommit(changeset) { throw "Method not implemented."; }
}

class Synced extends DocumentStateStrategy {
  commit(name, adapter, changeset) {
    adapter.commit(name, changset);
    return new InFlight(this._revision, changeset);
  }

  handleCommit(name, adapter, changeset) {
    return new Synced(changeset.apply(this._revision));
  }
}

class InFlight extends DocumentStateStrategy {
  constructor(revision, inflight) {
    this._inflight = inflight;
    super(revision);
  }

  get revision() { return this._inflight.apply(this._revision); }

  commit(name, adapter, changeset) {
    return new InFlightBuffered(this._revision, inflight, changeset);
  }

  handleAck(name, adapter, id) {
    return new Synced(this.revision);
  }

  handleCommit(name, adapter, changeset) {
    var newRevision = changeset.apply(this._revision);
    var newInFlight = changeset.transform(this._inflight);
    return new InFlight(newRevision, newInFlight);
  }
}

class InFlightBuffered extends DocumentStateStrategy {
  constructor(revision, inflight, queued) {
    this._inflight = inflight;
    this._queued = queued;
    super(revision);
  }

  get revision() { 
    var inflightRevision = this._inflight.apply(this._revision);
    return this._queued.apply(inflightRevision);
  }

  commit(name, adapter, changeset) {
    var newQueued = this.queued.concat(changeset);
    return new InFlightBuffered(this._revision, this._inflight, newQueued);
  }

  handleAck(name, adapter, id) {
    var newRevision = this._inflight.apply(this._revision);
    adapter.commit(name, this._queued);
    return new InFlight(newRevision, this._queued);
  }

  handleCommit(name, adapter, changeset) {
    var newRevision = changeset.apply(this._revision);
    var newInFlight = changeset.transform(this._inflight);
    var newQueued = changeset.transform(this._queued);
    return InFlightBuffered(newRevision, newInFlight, newQueued);
  }
}

module.exports = DocumentState;
