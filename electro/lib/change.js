var Place = require("./place");

class Change {
  constructor(op, place, ...args) {
    this._op = op;
    this._place = place;
    this._args = args;
  }

  get op() { return this._op; }
  get place() { return this._place; }
  get args() { return this._args; }

  get type() { throw new Error("Change.get:type: not implemented."); }
  get inverted() { throw new Error("Change.get:inverted: not implemented."); }

  relocate(toRelocate) { 
    throw new Error("Change.relocate: not implemented."); 
  }

  mutate(toMutate) { 
    throw new Error("Change.mutate: not implemented."); 
  }

  transform(toTransform) {
    var relocated = this.relocate(toTransform.place);
    var constr = toTransform.constructor;
    return new constr(toTransform.op, relocated, ...toTransform.args);
  }
}

class StringChange extends Change {
  get type() { return "string"; }
  get inverted() {
    var op = (this.op == "insert") ? "remove" : "insert";
    return new StringChange(op, this.place, ...this.args);
  }

  relocate(toRelocate) {
    var [union, branch] = this.place.getBranch(toRelocate);
    if (union === null) return toRelocate;
    if (union >= this.place.offset) {
      var [str] = this.args;
      union += (this.op == "remove" ? -1 : 1) * str.length;
    }
    return this.place.parent.concat(new Place([union]), branch);
  }

  mutate(toMutate) {
    var str = this.place.parent.getValueIn(toMutate);
    var offset = this.place.offset;
    switch (this.op) {
      case "insert":
        str = str.substr(0, offset) + this.args[0] + str.substr(offset);
        break;
      case "remove":
        str = str.substr(0, offset) + str.substr(offset + this.args[0].length);
        break;
    }
    var parent = this.place.parent.parent;
    parent.getValueIn(toMutate)[this.place.parent.offset] = str;
    return toMutate;
  }
}

class ArrayChange extends Change {
  get type() { return "array"; }
  get inverted() {
    var op = this.op, place = this.place, args = this.args;
    switch (this.op) {
      case "insert":
      case "remove":
        op = (this.op == "insert") ? "remove" : "insert";
        break;
      case "replace":
        var [before, after] = this.args;
        args = [after, before];
        break;
      case "move":
        args = [this.place.offset];
        place = this.place.parent.concat(new Place([this.args[0]]));
        break;
    }
    return new ArrayChange(op, place, ...args);
  }

  relocate(toRelocate) {
    var [union, branch] = this.place.getBranch(toRelocate);
    switch (this.op) {
      case "insert":
      case "remove":
        if (union === null) return toRelocate;
        if (union >= this.place.offset) {
          union += (this.op == "remove" ? -1 : 1);
        }
        break;
      case "replace":
        if (union === null) return toRelocate;
        if (!branch.isRoot) return null;
        break;
      case "move":
        if (!this.place.parent.isAncestorOf(toRelocate)) return toRelocate;
        var [newOffset] = this.args, offset = this.place.offset;
        union = toRelocate.offset;
        if (newOffset > offset && union > offset && union <= newOffset) union--;
        if (newOffset < offset && union > newOffset && union <= offset) union++;
        break;
    }
    return this.place.parent.concat(new Place([union]), branch);
  }

  mutate(toMutate) {
    var ctx = this.place.parent.getValueIn(toMutate);
    var offset = this.place.offset;
    switch (this.op) {
      case "insert":
        var [insertion] = this.args;
        ctx.splice(offset, 0, insertion);
        break;
      case "remove":
        ctx.splice(offset, 1);
        break;
      case "replace":
        var [, after] = this.args;
        ctx[offset] = after;
        break;
      case "move":
        var [newOffset] = this.args;
        var [existing] = ctx.splice(offset, 1);
        ctx.splice(newOffset, 0, existing);
        break;
    }
    return toMutate;
  }
}

class ObjectChange extends Change {
  get type() { return "object"; }
  get inverted() {
    var op = this.op, args = this.args;
    switch (this.op) {
      case "insert":
      case "remove":
        op = (this.op == "insert") ? "remove" : "insert";
        break;
      case "replace":
        var [before, after] = this.args;
        args = [after, before];
        break;
    }
    return new ObjectChange(op, this.place, ...args);
  }

  relocate(toRelocate) {
    return this.place.isAncestorOf(toRelocate) ? null : toRelocate;
  }

  mutate(toMutate) {
    var ctx = this.place.parent.getValueIn(toMutate);
    var offset = this.place.offset;
    switch (this.op) {
      case "insert":
        var [insertion] = this.args;
        ctx[offset] = insertion;
        break;
      case "replace":
        var [, after] = this.args;
        ctx[offset] = after;
        break;
      case "remove":
        delete ctx[offset];
        break;
    }
    return toMutate;
  }
}

module.exports = {
  Change: Change,
  StringChange: StringChange,
  ArrayChange: ArrayChange,
  ObjectChange: ObjectChange
};
