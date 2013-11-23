class Revision {
  constructor(sequenceId, data) {
    this._sequenceId = sequenceId || 1;
    this._data = data || {};
  }

  get sequenceId() { return this._sequenceId; }
  get data() { return this._data; }
}

class Changeset {
  constructor (baseSequenceId, changes) {
    this._baseSequenceId = aBaseRevision;
    this._changes = changes || [];
    if (!this._changes.every(Change.isValid))
      throw new Error("Changeset: change in set is invalid");
  }

  get baseSequenceId() { return this._baseSequenceId; }
  get changes() { return this._changes; }

  push(change) {
    if (!Change.isValid(change))
      throw new Error("Changeset.push: change is invalid");

    this._changes.push(change);
  }

  concat(changeset) {
    return new Changeset(this.changes.concat(changeset.changes));
  }
  
  apply(revision) {
    if (revision.sequenceId != this.baseSequenceId) {
      throw new Error("Changeset.apply: sequence IDs do not match on " +
                      "document revision and changeset.");
    }

    var cloneWithChanges = this.changes.reduce((data, change) =>
      Change.mutate(change, data), Util.cloneObject(revision.data));

    return new Revision(cloneWithChanges, revision.sequenceId + 1)
  }

  invert() {
    return new Changeset(this.changes.reduceRight(
      (inverted, change) => inverted.concat(Change.invert(change)), []));
  }

  transform(changeset) {
    var transformByChangeset = (toTransform) => 
      changeset.changes.reduce((transforming, change) => 
        Change.transform(change, transforming), toTransform);

    return new Changeset(this.changes.map(transformByChangeset));
  }  
}

Changeset.fromRevision = (revision) => 
  new Changeset(revision.sequenceId + 1);
