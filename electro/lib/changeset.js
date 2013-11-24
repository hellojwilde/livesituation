var Util = require("./util");
var Revision = require("./revision");
var {Change} = require("./change");

class Changeset {
  constructor (baseSequenceId, changes) {
    this._baseSequenceId = baseSequenceId;
    this._changes = changes || [];
  }

  get baseSequenceId() { return this._baseSequenceId; }
  get changes() { return this._changes; }

  get inverted() {
    var invertedChanges = this.changes.reduceRight((inverted, change) => 
      inverted.concat(change.inverted), []);
    return new Changeset(this.baseSequenceId, invertedChanges);
  }

  push(change) { 
    this._changes.push(change);
    return this;
  }

  concat(...changesets) {
    if (!changesets.every((set) => set.baseSequenceId == this.baseSequenceId)) {
      throw new Error("Changeset.concat: not all base sequence IDs are " +
                      "identical, which could cause data corruption.");
    }

    return new Changeset(this.baseSequenceId,
      this.changes.concat(...changesets.map((set) => set.changes)));
  }
  
  apply(toRevise) {
    if (toRevise.sequenceId !== this.baseSequenceId) {
      throw new Error("Changeset.apply: sequence IDs do not match on " +
                      "document revision and changeset.");
    }

    var cloneWithChanges = this.changes.reduce((data, change) =>
      change.mutate(data), Util.cloneObject(toRevise.data));
    return new Revision(toRevise.sequenceId + 1, cloneWithChanges);
  }

  relocate(toRelocate) {
    return this.changes.reduce((relocating, change) => 
      change.relocate(relocating), toRelocate);
  }

  transform(toTransform) {
    if (toTransform instanceof Change) {
      return this.changes.reduce((transforming, change) => 
        change.transform(transforming), toTransform);
    } else {
      var transformed = toTransform.changes.map((change) => 
        this.transform(change));
      return new Changeset(this.baseSequenceId, transformed);
    }
  }
}

Changeset.fromRevision = (revision) => 
  new Changeset(revision.sequenceId + 1);

module.exports = Changeset;
