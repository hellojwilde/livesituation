"use strict";

var _ = require("underscore");

function Revision(sequenceId, data) {
  this._sequenceId = sequenceId;
  this._data = data;
}

Revision.prototype = {
  getSequenceId: function () { return this._sequenceId; },
  getData: function () { return this._data; },

  isEqualTo: function (other) { 
    return _.equal(this._data, other.getData()) &&
           this._sequenceId == other.getSequenceId();
  }
};

module.exports = Revision;
