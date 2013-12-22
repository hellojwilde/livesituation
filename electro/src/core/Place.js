"use strict";

var _ = require("underscore");

function Place(path) {
  this._path = path || [];
}

Place.prototype = {
  getDepth: function () { return this._path.length; },
  getParent: function () { return new Place(_.initial(this._path)); },
  getOffset: function () { return _.last(this._path); },
  getOffsetAt: function(idx) { return this._path[idx]; },
  
  isRoot: function () { return !this._path.length; },
  
  isEqualTo: function (otherPlace) {
    return _.isEqual(this._path, otherPlace.toPath());
  },
  
  isAncestorOf: function (otherPlace) {
    var otherPlaceParent = otherPlace.getParent();
    return _.every(this._path, function (offset, idx) { 
      return offset === otherPlaceParent.getOffsetAt(idx); 
    });
  },
  
  getSiblingBranchIn: function (otherPlace) {
    var parent = this.getParent();
    if (!parent.isAncestorOf(otherPlace)) return new Branch(otherPlace);
    return Branch.getForPlaceIndex(otherPlace, parent.getDepth());
  },
  
  getChildBranchIn: function (otherPlace) {
    if (! this.isAncestorOf(otherPlace) && !this.isEqualTo(otherPlace)) 
      return new Branch(otherPlace);
    return Branch.getForPlaceIndex(otherPlace, this.getDepth() - 1);
  },
  
  hasValueAt: function (data) {
    return !_.isUndefined(this.getValueAt(data));
  },
  
  getValueAt: function (data) {
    return _.reduce(this._path, function(ctx, offset) {
      return (typeof ctx == "string") ? ctx.charAt(offset) : ctx[offset];
    }, data);
  },
  
  concat: function () {
    return new Place(_.reduce(arguments, function (path, place) {
      return path.concat(place.toPath());
    }, this._path));
  },
  
  slice: function (from, to) { 
    return new Place(this._path.slice(from, to)); 
  },
  
  toPath: function () { return this._path; },
};

function Branch(base, branchOffset, branch) {
  this._base = base;
  this._branchOffset = branchOffset;
  this._branch = branch;
}

Branch.prototype = {
  getBase: function () { return this._base; },
  getBranchOffset: function () { return this._branchOffset; },
  getBranch: function () { return this._branch; },
  
  getWithNewBranchOffset: function(branchOffset) {
    return new Branch(this._base, branchOffset, this._branch);
  },
  
  toPlace: function() {
    return this._base.concat(new Place([this._branchOffset]), this._branch);
  }
};

Branch.getForPlaceIndex = function (otherPlace, idx) {
  var base = otherPlace.slice(0, idx);
  var branchOffset = otherPlace.getOffsetAt(idx);
  var branch = otherPlace.slice(idx + 1);
  return new Branch(base, branchOffset, branch);
};

module.exports = Place;
