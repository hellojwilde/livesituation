"use strict";

var Util = require("./Util");
var Revision = require("./Revision");
var {Change} = require("./Change");

class Changeset {
  constructor (baseSequenceId, changes) {
    this._baseSequenceId = baseSequenceId;
    this._changes = changes || [];
  }

  get baseSequenceId() { return this._baseSequenceId; }
  get changes() { return this._changes; }

  get inverted() {
    var invertedChanges = this.changes.reduceRight(
      (inverted, change) => inverted.concat(change.inverted), []);
    return new Changeset(this.baseSequenceId, invertedChanges);
  }

  push(change) { 
    this._changes.push(change);
    return this;
  }

  concat(...changesets) {
    if (!changesets.every((set) => set.baseSequenceId == this.baseSequenceId))
      throw "All changeset base sequence IDs need to be identical for concat.";

    return new Changeset(this.baseSequenceId,
      this.changes.concat(...changesets.map((set) => set.changes)));
  }
  
  apply(toRevise) {
    if (toRevise.sequenceId !== this.baseSequenceId)
      throw "Changset's sequence ID must match revision sequence ID to apply.";

    var cloneWithChanges = this.changes.reduce(
      (data, change) => change.mutate(data), Util.cloneObject(toRevise.data));
    return new Revision(toRevise.sequenceId + 1, cloneWithChanges);
  }

  relocate(toRelocate) {
    return this.changes.reduce((relocating, change) => 
      change.relocate(relocating), toRelocate);
  }

  transform(toTransform) {
    if (toTransform instanceof Change) {
      return this.changes.reduce(
        (transforming, change) => change.transform(transforming), toTransform);
    } else {
      var transformed = toTransform.changes.map(
        (change) => this.transform(change));
      return new Changeset(this.baseSequenceId, transformed);
    }
  }
}

Changeset.fromRevision = (revision, changes) => 
  new Changeset(revision.sequenceId + 1, changes);

module.exports = Changeset;
