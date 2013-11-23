var Change = {
  types: {},

  isValid: function (change) {
    return this.types[change.type] != undefined &&
           this.types[change.type].isValid(change);
  },

  invert: function (change) {
    return this.types[change.type].invert(change);
  },

  relocate: function (change, toRelocate) {
    if (Place.isAncestorOf(change.place, toRelocate)) {
      return toRelocate;
    }

    return this.types[change.type].relocate(change, toRelocate);
  }
};

Change.types.string = {
  ops: ["insert", "remove"],

  isValid: function (change) {
    return this.ops.indexOf(change.op) !== -1;
  },

  invert: function (change) {
    return {
      type: change.type,
      op: (change.op == "insert") ? "remove" : "insert",
      place: change.place,
      val: change.val
    }
  },

  relocate: function (change, toRelocate) {
    var offset = Place.getHere(change.place);
    var parent = Place.getParent(change.place);
    var [relocating, later] = Place.getBranch(change.place, toRelocate);

    if (relocating > offset) {
      relocating += (change.op == "remove" ? -1 : 1) * change.val.length;
    }

    return Place.fromFragments(parent, relocating, later);
  }
};

Change.types.object = {
  ops: ["insert", "remove", "replace"],

  isValid: function (change) {
    return this.ops.indexOf(change.op) !== -1;
  },

  invert: function (change) {
    var op = { type: change.type, place: change.place };
    switch (change.op) {
      case "insert":
      case "remove":
        op.op = (change.op == "insert") ? "remove" : "insert";
        op.val = change.val;
        break;
      case "replace":
        op.op = change.op;
        op.before = change.after;
        op.after = change.before;
        break;
    }
    return op;
  },

  relocate: function (change, toRelocate) {
    return null;
  }
};

Change.types.array = {
  ops: ["insert", "remove", "replace", "move"],

  isValid: function (change) {
    return this.ops.indexOf(change.op) !== -1;
  },

  invert: function (change) {
    var op = { type: change.type, place: change.place };
    switch (change.op) {
      case "insert":
      case "remove":
        op.op = (change.op == "insert") ? "remove" : "insert";
        op.val = change.val;
        break;
      case "replace":
        op.op = change.op;
        op.before = change.after;
        op.after = change.before;
        break;
      case "move":
        var parent = Place.getParent(change.place);
        var offset = Place.getHere(change.place);
        op.newOffset = offset;
        op.place = Place.fromFragments(parent, change.newOffset);
        break;
    }
    return op;
  },

  relocate: function (change, toRelocate) {
    var offset = Place.getHere(change.place);
    var parent = Place.getParent(change.place);
    var [relocating, later] = Place.getBranch(change.place, toRelocate);
    switch (change.op) {
      case "insert":
      case "remove":
        if (relocating > offset) {
          relocating += (change.op == "remove" ? -1 : 1);
        }
        break;
      case "replace":
        return null;
        break;
      case "move":
        if (change.newOffset > offset && relocating > offset 
          && relocating <= change.newOffset) {
          relocating--;
        }
        if (change.newOffset < offset && relocating > change.newOffset 
          && relocating <= offset) {
          relocating++;
        }
        break;
    }
    return Place.fromFragments(parent, relocating, later);
  }
};