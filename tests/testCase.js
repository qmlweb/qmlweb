(function() {
  function contextVariable(obj, name) {
    return obj.$context[name];
  }

  // add functions to testcase object, a `property var <functionName>`
  // must be defined in TestCase.qml
  function applyTestFunctions(path, testCase) {
    testCase.compareRender = function(suffix, render, callback) {
      //render parameter shouldnt affect anything, only used to disable
      //rendering on qt side.
      console.log(path, suffix, typeof render, callback);
      if (typeof render === "function") {
        console.log(suffix, typeof render, callback);
        callback = render;
      }
      var pngPath = path.replace("/qml/", "/png/");
      if (suffix !== "") {
        pngPath += "-" + suffix.replace(" ", "_");
      }
      return compareScreenshot(testCase.parent.dom, pngPath + ".png", callback);
    };

    testCase.jasmine = {
      "expect": expect,
      "fail": fail
    };
  }

  window.qmlTest = function(load, name, cases) {
    describe(name, function() {
      if (!cases) {
        qmlTestCase(load, name);
        return;
      }
      cases.forEach(function(caseName) {
        qmlTestCase(load, name, caseName);
      });
    });
  };

  function findTestCase(qml, name) {
    for (var i in qml.children) {
      var child = qml.children[i];
      var index = i;
      if (!child.hasOwnProperty("__isTest")) continue;
      var testCaseName = child.name;
      if (name === undefined || name === testCaseName)
        return child;
    }
    throw new Error("cannot find testcase " + name);
  }

  function qmlTestCase(load, name, caseName) {
    var specName = name + " " + (caseName || "default");
    it(specName, function(done) {
      var qml = load(name, this.div);
      var oldDone = done;

      //stop engine when test is done, creates strange behaviour otherwise.
      done = function() { //should be fixed globally
        qmlEngine.stop();
        return oldDone();
      };
      var div = this.div;
      var testCase = findTestCase(qml, caseName);
      console.log("PATH: ", load.path);
      applyTestFunctions(load.path + name, testCase);
      testCase.start(done);
    });
  }
})();
