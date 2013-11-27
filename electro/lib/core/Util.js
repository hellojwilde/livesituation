"use strict";

module.exports = {
  cloneObject: function cloneObject (aObject) {
    var clone = {}, item;
    for (var key in aObject) {
      item = aObject[key];
      if (typeof item == "object") clone[key] = cloneObject(item);
      else clone[key] = item;
    }
    return clone;
  }
};
