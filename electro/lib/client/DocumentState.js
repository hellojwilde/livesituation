"use strict";

class DocumentState {
  constructor(doc) {
    this._doc = doc;
  }

  commit(changeset) { throw "Method not implemented." }
  receiveTransaction(transaction) { throw "Method not implemented." }
}

class Synchronized extends DocumentState {
  constructor(doc, revision) {
    this._revision = revision;
    super(doc);
  }

  get revision() { return this._revision; }

  commit(changeset) {
    this._doc.adapter.commit(this._doc.name, changeset)
    return new Pending(this._doc, this._revision, changeset);
  }

  receiveTransaction(transaction) {
    this._revision = transaction.changeset.apply(this._revision);
    return this;
  }
}

class Pending extends DocumentState {
  constructor(doc, baseRevision, pending) {

  }

  commit(changeset) {

  }

  receiveTransaction(transaction) {
    this._revision = transaction.changeset.apply(this._revision);
  }
}

class PendingBuffered extends DocumentState {
  commit(changeset) {

  }

  receiveTransaction(transaction) {

  }
}

module.exports = { DocumentState, Synchronized, Pending, PendingBuffered };
