"use strict";

var _ = require("underscore");
var Place = require("./Place");

function getParentTypeChangeProto(methods) {
  function F () { Change.call(this); }
  F.prototype = Object.create(Change.prototype);
  F.prototype.constructor = F;
  _.extend(F.prototype, methods);
  return F;
}

function isChange(obj) {
  return obj instanceof Change;
}

function Change(type, place, args) {
  this._type = type;
  this._place = place;
  this._args = args;
}

Change.prototype = {
  getType: function () { return this._type; },
  getPlace: function  () { return this._place; },
  getArgs: function () { return this._args; },
  
  transform: function (otherChange) {
    var relocated = this.relocate(otherChange.getPlace());
    var $ParentTypeChange = otherChange.constructor;
    return new $ParentTypeChange(otherChange.getType(), relocated, 
                                 otherChange.getArgs());
  }
};

var Type = {
  Insert: "insert",
  Remove: "remove",
  Replace: "replace",
  Move: "move"
};

var ArrayChange = getParentTypeChangeProto({
  getInversion: function () {
    var type = this._type;
    var place = this._place;
    var args = this._args;
    
    switch(this._type) {
      case Type.Insert:
      case Type.Remove:
        type = (type == Type.Insert) ? Type.Remove : Type.Insert;
        break;
      case Type.Replace:
        args = [_.last(args), _.first(args)];
        break;
      case Type.Move:
        args = [place.getOffset()];
        place = place.getParent().concat(new Place([this.args[0]]));
        break;
    }
    
    return new ArrayChange(type, place, args);
  },
  
  relocate: function (otherPlace) {
    switch(this._type) {
      case Type.Insert:
      case Type.Remove:
        // Insertions and removals shift siblings at later indices and their 
        // children forward one on insertion and backward space on removal.
        var sibling = this._place.getSiblingBranchIn(otherPlace);
        var offset = sibling.getBranchOffset();
        if (offset && offset >= this._place.getOffset()) {
          offset += (this._type == Type.Insert ? 1 : -1);
          return sibling.getWithNewBranchOffset(offset).toPlace();
        }
        break;
      case Type.Replace:
        // Replacements invalidate children.
        if (this._place.isAncestorOf(otherPlace)) return null;
        break;
      case Type.Move:
        // Moves shift siblings and surrounding indicies and their children, 
        // along with the descendants of the path affected by the move itself.
        var newOffset = _.first(this._args);
        var offset = this._place.getOffset();
        
        var children = this._place.getChildBranchIn(otherPlace);
        if (children.getBranchOffset()) {
          return children.getWithNewBranchOffset(newOffset).toPlace();
        }
        
        var sibling = this._place.getSiblingBranchIn(otherPlace);
        var siblingOffset = sibling.getBranchOffset();
        if (siblingOffset) {
          if (newOffset > offset && siblingOffset > offset && 
              siblingOffset <= newOffset) siblingOffset--;
          if (newOffset < offset && siblingOffset > newOffset &&
              siblingOffset <= offset) siblingOffset++;
          return sibling.getWithNewBranchOffset(siblingOffset).toPlace();
        }
        break;
    }
    
    return otherPlace;
  },
  
  mutate: function (data) {
    var ctx = this._place.getParent().getValueAt(data);
    var offset = this._place.getOffset();
    
    switch (this._type) {
      case Type.Insert:
        var insertion = _.first(this._args);
        ctx.splice(offset, 0, insertion);
        break;
      case Type.Remove:
        ctx.splice(offset, 1);
        break;
      case Type.Replace:
        var after = _.last(this._args);
        ctx[offset] = after;
        break;
      case Type.Move:
        var newOffset = _.last(this._args);
        var existing = _.first(ctx.splice(offset, 1));
        ctx.splice(newOffset, 0, existing);
        break;
    }
    
    return data;
  }
});

var ObjectChange = getParentTypeChangeProto({
  getInversion: function () {
    var type = this._type;
    var args = this._args;
    
    switch (this._type) {
      case Type.Insert:
      case Type.Remove:
        type = type == Type.Insert ? Type.Remove : Type.Insert;
        break;
      case Type.Replace:
        args = [_.last(args), _.first(args)];
        break;
    }
    
    return new ObjectChange(type, this._place, args);
  },
  
  relocate: function (otherPlace) {
    // Invalidate all paths that are children of this one.
    return this._place.isAncestorOf(otherPlace) ? null : otherPlace;
  },
  
  mutate: function (data) {
    var ctx = this._place.getParent().getValueAt(data);
    var offset = this._place.getOffset();
    
    switch (this._type) {
      case Type.Insert:
        var insertion = _.first(this._args);
        ctx[offset] = insertion;
        break;
      case Type.Remove:
        delete ctx[offset];
        break;
      case Type.Replace:
        var after = _.last(this._args);
        ctx[offset] = after;
        break;
    }
    
    return data;
  }
});

var StringChange = getParentTypeChangeProto({
  getInversion: function () {
    var type = this._type == Type.Insert ? Type.Remove : Type.Insert;
    return new StringChange(op, this._place, this._args);
  },
  
  relocate: function (otherPlace) {
    // Similar to array insertions and removals: we need to shift siblings on
    // insertions and removals. However, the amount of the shift is equal to
    // the length of the substring being inserted and removed.
    var sibling = this._place.getSiblingBranchIn(otherPlace);
    var siblingOffset = sibling.getBranchOffset();
    if (siblingOffset) {
      var str = _.first(this._args);
      siblingOffset += (this._type == Type.Insert ? 1 : -1) * str.length;
      return sibling.getWithNewBranchOffset(siblingOffset).toPlace();
    }
    
    return otherPlace;
  },
  
  mutate: function (data) {
    var ctxPlace = this._place.getParent();
    var ctx = ctxPlace.getValueAt(data);
    var offset = this._place.getOffset();
    var str = _.first(this._args);
    
    switch (this,_type) {
      case Type.Insert:
        ctx = ctx.substr(0, offset) + str + ctx.substr(offset);
        break;
      case Type.Remove:
        ctx = ctx.substr(0, offset) + ctx.substr(offset + str.length);
        break;
    }
    
    var parent = ctxPlace.getParent();
    parent.getValueAt(data)[ctxPlace.getOffset()] = ctx;
    
    return data;
  }
});

module.exports = {
  isChange: isChange,
  ChangeType: Type,
  ArrayChange: ArrayChange,
  ObjectChange: ObjectChange,
  StringChange: StringChange
};
