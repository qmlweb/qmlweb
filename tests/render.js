(function() {
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
    return ctx.getImageData(0, 0, img.height, img.width).data;
  }

  function imagesEqual(a, b) {
    if (a.width !== b.width || a.height !== b.height)
      return false;

    a = image2data(a);
    b = image2data(b);

    if (a.length !== b.length)
      return false;

    for (var i = 0; i < a.length; i++)
      if (a[i] !== b[i])
        return false;

    return true;
  }

  function delayedFrames(callback, frames) {
    if (frames === 0)
      return callback;
    return function() {
      window.requestAnimationFrame(delayedFrames(callback, frames - 1));
    };
  }

  window.compareRender = function(div, png, callback) {
    var tmp = png.replace("/base/tests/", "");
    var result, expected, loaded = 0;

    var process = function() {
      if (++loaded !== 2) return;
      callback(imagesEqual(result, expected));
    };

    expected = document.createElement('img');
    expected.src = png;
    expected.onload = process;
    return function() {
      result = screenshot(div, {
        fileName: tmp
      });
      result.onload = process;
    };
  };

  window.renderTest = function(test) {
    if (!window.top.callPhantom) {
      console.log('Render tests require PhantomJS');
      return;
    }
    it("Render " + test.name, function(done) {
      var div = loadQmlFile(test.qml, this.div).dom;

      var onTestLoad = compareRender(div, test.png, function(equal) {
        expect(equal);
        done();
      });
      if (test.delayed) {
        window.onTestLoad = function(options) {
          options = options || {};
          delayedFrames(onTestLoad, options.framesDelay || 0)();
        };
      } else {
        onTestLoad();
      }
    });
  };
})();
