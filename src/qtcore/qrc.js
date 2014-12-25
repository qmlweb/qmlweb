(function(global) {
global.qrc = {
  includesFile: function(path) {
    return typeof qrc[path] != 'undefined';
  }
};
}(typeof window != 'undefined' ? global : window);
