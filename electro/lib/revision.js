class Revision {
  constructor(sequenceId, data) {
    this._sequenceId = sequenceId;
    this._data = data || {};
  }

  get sequenceId() { return this._sequenceId; }
  get data() { return this._data; }
}

module.exports = Revision;