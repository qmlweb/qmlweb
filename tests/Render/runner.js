(function() {
  if (!window.top.callPhantom && !window.top.chromeScreenshot) {
    console.log("Render tests require Puppeteer or PhantomJS");
    return;
  }

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  beforeAll(function(done) {
    setTimeout(done, 200);
  });

  function imagesFuzzyEqual(a, b, delta) {
    if (!delta) return QmlWeb.imagesEqual(a, b);

    var A = QmlWeb.image2pixels(a);
    var B = QmlWeb.image2pixels(b);
    if (A.length !== B.length) return false;
    for (var i = 0; i < A.length; i++) {
      var diff = A[i] - B[i];
      if (diff < 0) diff = -diff;
      if (diff > delta) return false;
    }
    return true;
  }

  function delayedFrames(callback, frames) {
    if (frames === 0) {
      return callback;
    }
    return function() {
      window.requestAnimationFrame(delayedFrames(callback, frames - 1));
    };
  }

  var regex = new RegExp("^/base/tests/Render/[^/]+/[^/]+\\.qml$");
  var tests = Object.keys(window.__karma__.files)
    .filter(function(path) {
      return regex.test(path);
    })
    .map(function(path) {
      return {
        qml: path,
        png: path.replace(/.qml$/, ".png"),
        group: path.replace("/base/tests/Render/", "").replace(/\/[^/]+$/, "")
                   .replace(/\//g, "."),
        name: path.replace(/^.*\//, "").replace(".qml", "")
      };
    })
    .reduce(function(data, entry) {
      if (!data.hasOwnProperty(entry.group)) {
        data[entry.group] = [];
      }

      data[entry.group].push(entry);
      return data;
    }, {});

  Object.keys(tests).forEach(function(group) {
    describe("Render." + group, function() {
      setupDivElement();
      tests[group].forEach(function(test) {
        it(test.name, function(done) {
          var div = loadQmlFile(test.qml, this.div).dom;
          var result;
          var expected;
          var loaded = 0;
          var fuzz = group.indexOf("Fuzzy") !== -1 ? 1 : 0;

          var process = function() {
            if (++loaded !== 2) return;
            expect(imagesFuzzyEqual(result, expected, fuzz)).toBe(true);
            done();
          };

          expected = document.createElement("img");
          expected.src = test.png;
          expected.onload = process;

          var onTestLoad = function() {
            result = QmlWeb.screenshot(div, {
              fileName: test.group + "/" + test.name + ".png"
            });
            result.onload = process;
          };

          if (group.indexOf("Async") !== -1) {
            window.onTestLoad = function(options) {
              delayedFrames(onTestLoad, options && options.framesDelay || 0)();
            };
          } else {
            onTestLoad();
          }
        });
      });
    });
  });
}());
