var Place = {
  isUniversalAncestor: function (place) { return place.length == 0; },
  isChild: function (place) { return place.length > 0; },

  isEqualTo: function (place, otherPlace) {
    if (otherPlace.length > place) 
      [place, otherPlace] = [otherPlace, place];

    return place.every((offset, idx) => offset == otherPlace[idx]);
  },

  isAncestorOf: function (place, otherPlace) {
    if (this.isUniversalAncestor(otherPlace))
      return false;

    var otherPlaceParent = this.getParent(otherPlace);
    return place.every((offset, idx) => offset === otherPlaceParent[idx]);
  },

  getParent: function (place) {
    return this.isChild(place) ? place.slice(0, -1) : [];
  },

  getHere: function (place) {
    return this.isChild(place) ? place[place.length - 1] : null;
  },

  getBranch: function (place, childPlace) {
    if (!this.isAncestorOf(place, childPlace) &&
        !this.isEqualTo(place, childPlace)) {
      return [null, []];
    }

    var relocating = childPlace[place.length - 1];
    var later = childPlace.slice(place.length);
    return [relocating, later];
  },

  fromFragments: function (...placeFragments) {
    return [].concat(...placeFragments);
  },

  isValueTraversible: function (value) {
    return (typeof value == "array" || typeof value == "object") && 
           value !== null;
  },

  getValueAt: function (place, data) {
    return place.reduce((parent, offset) =>
      this.isValueTraversible(parent) ? parent[offset] : null, data);
  }
};

exports.Place = Place;