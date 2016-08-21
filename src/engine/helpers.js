class QmlWebHelpers {
  static arrayFindIndex(array, callback) {
    // Note: does not support thisArg, we don't need that
    if (!Array.prototype.findIndex) {
      for (const key in array) {
        if (callback(array[key], key, array)) {
          return key;
        }
      }
      return -1;
    }
    return Array.prototype.findIndex.call(array, callback);
  }
}

QmlWeb.helpers = QmlWebHelpers;
