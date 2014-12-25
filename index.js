var es = require('event-stream');
var gutil = require('gulp-util');
var qml = require('./lib/qt.js');

module.exports = function (opt) {
  function modifyFile(file) {
    if (file.isNull()) return this.emit('data', file);
    if (file.isStream()) return this.emit('error', new Error("gulp-qml: Streaming not supported"));

    var data;
    var str  = file.contents.toString('utf8');
    var dest = gutil.replaceExtension(file.path, ".js");
    var src;

    try {
      data = qmlparse(str);
    } catch (err) {
      return this.emit('error', new Error(file.path + ': ' + err));
    }

    src = "qrc["+file.path+"] = " + JSON.stringify(data);

    file.contents = new Buffer(src);
    file.path = dest;
    this.emit('data', file);
  }

  return es.through(modifyFile);
};
