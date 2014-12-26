global.qrc = {
  includesFile: function(path) {
    return typeof qrc[path] != 'undefined';
  }
};
