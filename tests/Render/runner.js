(function() {
  if (!window.top.callPhantom) {
    console.log('Render tests require PhantomJS');
    return;
  }

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

  function screenshot(div, options) {
    if (!window.top.callPhantom)
      return undefined;

    var rect0 = div.getBoundingClientRect();
    var rect1 = window.parent.document.getElementById('context')
                                      .getBoundingClientRect();
    var offset = {
      width: div.offsetWidth,
      height: div.offsetHeight,
      top: rect0.top + rect1.top,
      left: rect0.left + rect1.left
    };

    var base64 = window.top.callPhantom('render', {
      offset: offset,
      fileName: options && options.fileName || undefined
    });
    var image = document.createElement('img');
    image.src = 'data:image/png;base64,' + base64;
    return image;
  }

  function image2data(img) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.height = img.height;
    canvas.width = img.width;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png', 1);
  }

  function imagesEqual(a, b) {
    if (a.width !== b.width || a.height !== b.height)
      return false;

    return image2data(a) === image2data(b);
  }

  function delayedFrames(callback, frames) {
    if (frames === 0)
      return callback;
    return function() {
      window.requestAnimationFrame(delayedFrames(callback, frames - 1));
    };
  }

  var regex = new RegExp('^/base/tests/Render/.*\.qml$');
  var tests = Object.keys(window.__karma__.files).filter(function(path) {
    return regex.test(path);
  }).map(function(path) {
    return {
      qml: path,
      png: path.replace(/.qml$/, '.png'),
      group: path.replace('/base/tests/Render/', '').replace(/\/[^/]+$/, '')
                 .replace(/\//g, '.'),
      name: path.replace(/^.*\//, '').replace('.qml', '')
    };
  }).reduce(function(data, entry) {
    if (!data.hasOwnProperty(entry.group))
      data[entry.group] = [];

    data[entry.group].push(entry);
    return data;
  }, {});

  Object.keys(tests).forEach(function(group) {
    describe('Render.' + group, function() {
      setupDivElement();
      tests[group].forEach(function(test) {
        it(test.name, function(done) {
          var div = loadQmlFile(test.qml, this.div).dom;
          var result, expected, loaded = 0;

          var process = function() {
            if (++loaded !== 2) return;
            expect(imagesEqual(result, expected)).toBe(true);
            done();
          };

          expected = document.createElement('img');
          expected.src = test.png;
          expected.onload = process;

          var onTestLoad = function() {
            result = screenshot(div, {
              fileName: test.group + '/' + test.name + '.png'
            });
            result.onload = process;
          };

          if (group.indexOf('Async') !== -1) {
            window.onTestLoad = function(options) {
              options = options || {};
              delayedFrames(onTestLoad, options.framesDelay || 0)();
            };
          } else {
            onTestLoad();
          }
        });
      });
    });
  });
})();
