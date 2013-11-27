"use strict";

function isTraversible(val) {
  return typeof val == "object" && val != null;
}

class Place {
  constructor(path) {
    this._path = path || [];
  }

  get path() { return this._path; }
  get isRoot() { return this._path.length === 0; }
  get parent() { return new Place(this.isRoot ? [] : this.path.slice(0, -1)); }
  get offset() { return this.isRoot ? null : this.path[this.path.length - 1]; }

  isEqualTo(place) {
    var [base, other] = (place.path.length > this.path.length) ? 
      [place.path, this.path] : [this.path, place.path];
    return base.every((offset, idx) => offset === other[idx]);
  }

  isAncestorOf(place) {
    if (place.isRoot) return false;
    var parentPath = place.parent.path;
    return this.path.every((offset, idx) => offset === parentPath[idx]);
  }

  getBranch(place) {
    if (!this.isAncestorOf(place) && !this.isEqualTo(place)) 
      return [null, new Place()];

    var union = place.path[this.path.length - 1];
    var branch = place.path.slice(this.path.length);
    return [union, new Place(branch)];
  }

  hasValueAt(data) {
    var parentValueAt = this.parent.getValueAt(data);
    return parentValueAt.hasOwnProperty(this.offset);
  }
  
  getValueAt(data) {
    return this.path.reduce(
      (parent, offset) => isTraversible(parent) ? parent[offset] : null, data);
  }

  concat(...places) {
    return new Place(this.path.concat(...places.map((place) => place.path)));
  }
}

module.exports = Place;