var Place = {
  isAncestorOf: function (place, otherPlace) {
    return place.reduce((areEqual, offset, idx) =>
      areEqual && (offset === otherPlace[idx]), true);
  },

  getParent: function (place) {
    return place.slice(0, -1);
  },

  getHere: function (place) {
    return place[place.length - 1];
  },

  getBranch: function (place, childPlace) {
    var relocating = childPlace[place.length - 1];
    var later = toRelocate.slice(place.length);
    return [relocating, later];
  },

  fromFragments: function (...placeFragments) {
    return [].concat(...placeFragments);
  },

  getValueAt: function (place, data) {
    return place.reduce((parent, offset) => parent[offset], data);
  },

  setValueAt: function (place, data, value) {
    var parent = this.getValueAt(this.getParent(place), data);
    return parent[offset] = value;
  }
};
