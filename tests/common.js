function createQmlEngine(opts){
  var div = document.createElement('div');
  var qml = new QMLEngine(div, opts || {});
  qml.start()
  return qml
}

function loadQmlFile(file, opts) {
  var div = document.createElement('div');
  var qml = new QMLEngine(div, opts || {});
  qml.loadFile('/base/tests/' + file);
  qml.start();
  document.body.appendChild(div);
  return qml;
}

function prefixedQmlLoader(prefix) {
  return function(file, opts) {
    return loadQmlFile(prefix + file + '.qml', opts);
  }
}
