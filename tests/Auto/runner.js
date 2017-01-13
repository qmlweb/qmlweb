// For Qt QML, run with `qmltestrunner -input tests/Auto/`

(function() {
  var regex = new RegExp("^/base/tests/Auto/.*/tst_[^/]+\\.qml$");
  var tests = Object.keys(window.__karma__.files)
    .filter(function(path) {
      return regex.test(path);
    })
    .map(function(path) {
      return {
        qml: path,
        group: path.replace("/base/tests/Auto/", "").replace(/\/[^/]+$/, "")
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
    describe("Auto." + group, function() {
      setupDivElement();
      tests[group].forEach(function(test) {
        it(test.name, function() {
          loadQmlFile(test.qml, this.div);
          var t = QmlWeb.engine.tests;
          if (t.errors.length > 0) {
            throw new Error(t.errors.join("\n") + "\n");
          }
          expect(t.total).toBe(1);
          expect(t.completed).toBe(1);
          expect(t.stats.pass + t.stats.skip).toBeGreaterThan(0);
          expect(t.stats.fail).toBe(0);
        });
      });
    });
  });
}());
