"use strict";

class DocumentStrategy {
  constructor(revision) { 
    this._revision = revision; 
  }

  get revision() { return this._revision; }

  commit(changeset) { throw "Method not implemented."; }
  handleAck(id) { throw "Method not implemented."; }
  handleCommit(changeset) { throw "Method not implemented."; }
}

class Synced extends DocumentStrategy {
  commit(name, adapter, changeset) {
    adapter.commit(name, changset);
    return new InFlight(this._revision, changeset);
  }

  handleCommit(name, adapter, changeset) {
    return new Synced(changeset.apply(this._revision));
  }
}

class InFlight extends DocumentStrategy {
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

class InFlightBuffered extends DocumentStrategy {
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

module.exports = { DocumentStrategy, Synced, InFlight, InFlightBuffered};
