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
  static mergeObjects(...args) {
    const merged = {};
    for (const i in args) {
      const arg = args[i];
      if (!arg) {
        continue;
      }
      for (const key in arg) {
        merged[key] = arg[key];
      }
    }
    return merged;
  }
  static reduceUri(uri) {
    let reducedUri = uri;
    let match;
    // eslint-disable-next-line no-cond-assign
    while (match = reducedUri.match(/\/?\.\//)) {
      const part1 = reducedUri.slice(0, match.index);
      const part2 = reducedUri.slice(match.index + match[0].length);
      reducedUri = `${part1}/${part2}`;
    }
    // eslint-disable-next-line no-cond-assign
    while (match = reducedUri.match(/([^/]+)(\/\.\.)\/?/)) {
      const part1 = reducedUri.slice(0, match.index);
      const part2 = reducedUri.slice(match.index + match[0].length);
      reducedUri = `${part1}/${part2}`;
    }
    return reducedUri;
  }
}

QmlWeb.helpers = QmlWebHelpers;
