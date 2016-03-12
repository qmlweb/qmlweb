(function() {
  if (!window.top.callPhantom) {
    console.log('Render tests require PhantomJS');
    return;
  }
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;


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
        test.delayed = test.group.indexOf('Async') !== -1;
        if (test.delayed) return;
        renderTest(test);
      });
    });
  });
})();
