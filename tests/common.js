function loadQmlFile(file, div, opts) {
  var engine = new QMLEngine(div, opts || {});
  engine.loadFile(file);
  engine.start();
  document.body.appendChild(div);
  return engine.rootObject;
}

function prefixedQmlLoader(prefix) {
  return function(file, opts) {
    return loadQmlFile('/base/tests/' + prefix + file + '.qml', opts);
  };
}

function loadQml(src, div, opts) {
  var engine = new QMLEngine(div, opts || {});
  engine.loadQML(src);
  engine.start();
  document.body.appendChild(div);
  return engine.rootObject;
}

function setupDivElement() {
  beforeEach(function() {
    this.div = document.createElement('div');
  });
  afterEach(function() {
    this.div.remove();
  });
}

var customMatchers = {
  toBeRoughly: function(util, customEqualityTesters) {
    return {
      compare: function(actual, expected, diff) {
        var result = {
          pass: actual > expected * (1 - diff) &&
                actual < expected * (1 + diff)
        };
        if (result.pass) {
          result.message = actual + " is roughly equal to " + expected;
        } else {
          result.message = "Expected " + actual + " to be roughly " + expected;
        }
        return result;
      }
    };
  }
};

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
