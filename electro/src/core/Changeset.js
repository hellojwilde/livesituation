"use strict";

var _ = require("underscore");
var Change = require("./Change");
var Revision = require("./Revision");

function Changeset(changes) {
  this._changes = changes || [];
}

Changeset.prototype = {
  getChanges: function () { return this._changes; },
  
  isEqualTo: function (otherChangeset) {
    var otherChanges = otherChangeset.getChanges();
    if (otherChanges.length != this._changes.length) return false;
    return _.every(this._changes, function (change, idx) {
      return change.isEqualTo(otherChanges[idx]);
    });
  },
  
  getInversion: function () {
    return new Changeset(_.reduceRight(this._changes, function (inv, change) {
      return inv.concat(change.getInversion()); 
    }, []));
  },
  
  relocate: function (otherPlace) {
    return _.reduce(this._changes, function (rel, change) { 
      return change.relocate(rel); 
    }, otherPlace);
  },
  
  transform: function (otherChange) {
    if (otherChange instanceof Changeset) {
      return new Changeset(_.map(otherChange.getChanges(), function (change) {
        return this.transform(change);
      }.bind(this)));
    } else {
      return _.reduce(this._changes, function (trans, change) {
        return change.transform(trans);
      }, otherChange);
    }
  },
  
  apply: function (revision) {
    var seq = revision.getSequenceId() + 1;
    return new Revision(seq, _.reduce(this._changes, function (data, change) {
      return change.mutate(data);
    }, _.clone(revision.getData())));
  },
  
  concat: function () {
    return new Changeset(_.reduce(arguments, function (all, set) {
      return all.concat(set.getChanges());
    }, []));
  },
  
  push: function (change) {
    this._changes.push(change);
    return this;
  }
};

module.exports = Changeset;
