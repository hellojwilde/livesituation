"use strict";

var _ = require("underscore");
var Place = require("./Place");

var ParentType = {
  Array: "array",
  Object: "object",
  String: "string"
};

var Type = {
  Insert: "insert",
  Remove: "remove",
  Replace: "replace",
  Move: "move"
};

function Change(parentType, type, place, args) {
  this._parentType = parentType;
  this._type = type;
  this._place = place;
  this._args = args;
}

Change.prototype = {
  getParentType: function () { return this._parentType; },
  getType: function () { return this._type; },
  getPlace: function  () { return this._place; },
  getArgs: function () { return this._args; },
  
  isEqualTo: function (otherChange) {
    return this.getType() == otherChange.getType() &&
      this.getPlace().isEqualTo(otherChange.getPlace()) &&
      _.isEqual(this.getArgs(), otherChange.getArgs());
  },
  
  transform: function (otherChange) {
    var relocated = this.relocate(otherChange.getPlace());
    var ParentTypeChange = otherChange.constructor;
    return new ParentTypeChange(otherChange.getType(), relocated, 
                                otherChange.getArgs());
  }
};

function ArrayChange(type, place, args) {
  Change.call(this, ParentType.Array, type, place, args);
}

ArrayChange.prototype = _.extend(Object.create(Change.prototype), {
  constructor: ArrayChange,
  
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
        var newOffset = _.first(this._args);
        args = [place.getOffset()];
        place = place.getParent().concat(new Place(newOffset));
        break;
    }
    
    return new ArrayChange(type, place, args);
  },
  
  relocate: function (otherPlace) {
    /*jshint -W004*/
    switch(this._type) {
      case Type.Insert:
      case Type.Remove:
        // Insertions and removals shift siblings at later indices and their 
        // children forward one on insertion and backward space on removal.
        var sibling = this._place.getSiblingBranchIn(otherPlace);
        var offset = sibling.getBranchOffset();
        if (!_.isUndefined(offset) && offset >= this._place.getOffset()) {
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
        if (!_.isUndefined(children.getBranchOffset())) {
          return children.getWithNewBranchOffset(newOffset).toPlace();
        }
        
        var sibling = this._place.getSiblingBranchIn(otherPlace);
        var siblingOffset = sibling.getBranchOffset();
        if (!_.isUndefined(siblingOffset)) {
          if (newOffset > offset && 
              siblingOffset < newOffset && siblingOffset >= offset) {
            siblingOffset--;
          }
          if (newOffset < offset && 
              newOffset <= siblingOffset && siblingOffset < offset) {
            siblingOffset++;
          }
          return sibling.getWithNewBranchOffset(siblingOffset).toPlace();
        }
        break;
    }
    
    return otherPlace;
    /*jshint +W004*/
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

function ObjectChange(type, place, args) {
  Change.call(this, ParentType.Object, type, place, args);
}

ObjectChange.prototype = _.extend(Object.create(Change.prototype), {
  constructor: ObjectChange,
  
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

function StringChange(type, place, args) {
  Change.call(this, ParentType.String, type, place, args);
}

StringChange.prototype = _.extend(Object.create(Change.prototype), {
  constructor: StringChange,
  
  getInversion: function () {
    var type = this._type == Type.Insert ? Type.Remove : Type.Insert;
    return new StringChange(type, this._place, this._args);
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
    
    switch (this._type) {
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

function getParentNameTypeChange(parent) {
  switch (typeof parent) {
    case ParentType.Array:
      return ArrayChange;
    case ParentType.Object:
      return ObjectChange;
    case ParentType.String:
      return StringChange;
  }
}

function getParentTypeChange(parent) {
  switch (typeof parent) {
    case "string":
      return StringChange;
    case "object":
      if (parent instanceof Array) return ArrayChange;
      return ObjectChange;
  }
}

module.exports = {
  getParentNameTypeChange: getParentNameTypeChange,
  getParentTypeChange: getParentTypeChange,
  ParentType: ParentType,
  Type: Type,
  Change: Change,
  ArrayChange: ArrayChange,
  ObjectChange: ObjectChange,
  StringChange: StringChange
};
