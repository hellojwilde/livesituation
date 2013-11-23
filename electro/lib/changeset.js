(function (exports, undefined) {
  "use strict";

  function cloneObject(aObject) {
    var clone = {}, item;
    for (var key in aObject) {
      item = aObject[key];
      if (typeof item == "object") clone[key] = cloneObject(item);
      else clone[key] = item;
    }
    return clone;
  }

  class DocumentRevision {
    constructor(aData, aRevision) {
      this._data = aData || {};
      this._revision = aRevision || 1;
    }

    get data() { return this._data; }
    get revision() { return this._revision; }
  }

  class Changeset {
    constructor (aBaseRevision, aChanges) {
      this._baseRevision = aBaseRevision;
      this._changes = aChanges || [];
    }

    get baseRevision() { return this._baseRevision; }
    get changes() { return this._changes; }

    push(...aChange) {
      this._changes.push(aChange);
      return this;
    }

    concat(aChangeset) {
      return new Changeset(this.changes.concat(aChangeset.changes));
    }
    
    apply(aDocument) {
      if (aDocument.revision != this.baseRevision)
        throw new Error("Changeset.apply: revision mismatch");

      var cloneWithChanges = this.changes.reduce((aData, aChange) =>
        Change.mutate(aChange, aData), cloneObject(aDocument.data));

      return new Document(cloneWithChanges, aDocument.revision + 1)
    }

    invert() {
      return new Changeset(this.changes.reduceRight(
        (inverted, change) => inverted.concat(Change.invert(cur)), []));
    }

    transform(aChangeset) {
      var transformByChangeset = (aToTransform) => 
        aChangeset.changes.reduce((aTransforming, aChange) => 
          Change.transform(aChange, aTransforming), aToTransform);

      return new Changeset(this.changes.map(transformByChangeset));
    }  
  }

  Changeset.fromDocumentRevision = (aDocumentRevision) => 
    new Changeset(aDocumentRevision.revision + 1);

  exports.DocumentRevision = DocumentRevision;
  exports.Changeset = Changeset;
}(window));
