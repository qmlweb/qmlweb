function pathFromFilepath(file) {
    var basePath = file.split("/");
    basePath[basePath.length - 1] = "";
    basePath = basePath.join("/");
    return basePath;
}

// Helper. Ought to do absolutely nothing.
function noop(){};

// Helper to prevent some minimization cases. Ought to do "nothing".
function tilt() {arguments.length = 0};

// Helper to clone meta-objects for dynamic element creation
function cloneObject(obj) {
    if (null == obj || typeof obj != "object")
        return obj;
    var copy = new obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            if (typeof obj[attr] == "object")
                copy[attr] = cloneObject(obj[attr]);
            else
                copy[attr] = obj[attr];
        }
    }
    return copy;
}

function mergeObjects(obj1, obj2) {
  var mergedObject = {};

  if (typeof obj1 != 'undefined' && obj1 != null) {
    for (var key in obj1) { mergedObject[key] = obj1[key]; }
  }
  if (typeof obj2 != 'undefined' && obj2 != null) {
    for (var key in obj2) { mergedObject[key] = obj2[key]; }
  }
  return mergedObject;
}
