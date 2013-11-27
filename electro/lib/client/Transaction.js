class Transaction {
  constructor(id, changeset) {
    this._id = id;
    this._changeset = changeset;
  }

  get id() { return this._id; }
  get changeset() { return this._changeset; }
}

module.exports = Transaction;