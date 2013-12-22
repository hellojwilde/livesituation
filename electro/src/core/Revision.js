"use strict";

function Revision(sequenceId, data) {
  this._sequenceId = sequenceId;
  this._data = data;
}

Revision.prototype = {
  getSequenceId: function () { return this._sequenceId; },
  getData: function () { return this._data; }
};

module.exports = Revision;
