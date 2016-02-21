function loadQmlFile(file, opts) {
  var div = document.createElement('div');
  var qml = new QMLEngine(div, opts || {});
  qml.loadFile(file);
  qml.start();
  document.body.appendChild(div);
  return div;
}

function prefixedQmlLoader(prefix) {
  return function(file, opts) {
    return loadQmlFile('/base/tests/' + prefix + file + '.qml', opts);
  };
}

function loadQml(src, opts) {
  var div = document.createElement('div');
  var qml = new QMLEngine(div, opts || {});
  qml.loadQML(src);
  qml.start();
  document.body.appendChild(div);
  return qml;
}

(function() {
  var describeOrig = describe;
  var itOrig = it;
  var current = '';

  function isFailing(name) {
    var data = window.failingTests;
    current.split('.').forEach(function(part) {
      data = data[part] || {};
    });
    return Array.isArray(data) && data.indexOf(name) !== -1;
  }

  window.describe = function(name) {
    current = name;
    describeOrig.apply(this, arguments);
  };

  window.it = function(name) {
    if (isFailing(name)) {
      console.log('Test ' + current + '.' + name +
                  ' is known to be failing. Skipping...');
      return;
    }
    itOrig.apply(this, arguments);
  };
})();
