var {Change} = require("./change");
var {Revision} = require("./document");

class Changeset {
  constructor (baseSequenceId, changes) {
    this._baseSequenceId = aBaseRevision;
    this._changes = changes || [];
  }

  get baseSequenceId() { return this._baseSequenceId; }
  get changes() { return this._changes; }

  push(change) { 
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
      change.mutate(data), Util.cloneObject(revision.data));

    return new Revision(cloneWithChanges, revision.sequenceId + 1)
  }

  invert() {
    return new Changeset(this.changes.reduceRight(
      (inverted, change) => inverted.concat(change.inverted), []));
  }

  transform(changeset) {
    var transformByChangeset = (toTransform) => 
      changeset.changes.reduce((transforming, change) => 
        change.transform(transforming), toTransform);

    return new Changeset(this.changes.map(transformByChangeset));
  }  
}

Changeset.fromRevision = (revision) => 
  new Changeset(revision.sequenceId + 1);
