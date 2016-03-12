function contextVariable(obj, name) {
  return obj.$context[name];
}
//TODO: should be cached and checked against modification date
function readTests(load, name) {
  var div = document.createElement("div");
  var qml = load(name, div);
  var tests = [];
  for (var i in qml.children) {
    var child = qml.children[i];
    var index = i;
    if (!child.hasOwnProperty("__isTest")) continue;
    var testCaseName = child.name;
    tests.push({
      index: i,
      name: child.name
    });
  }
  div.remove();
  return tests;
}

function applyTestFunctions(path, testCase) {
  testCase.compareRender = function(suffix, render, callback) {
    //render parameter shouldnt affect anything, only used to disable
    //rendering on qt side.
    console.log(suffix, typeof render, callback);
    if (typeof render === "function") {
      console.log(suffix, typeof render, callback);
      callback = render;
    }
    if (suffix !== "") {
      path += "-" + suffix;
    }
    return compareScreenshot(testCase.parent.dom, path + ".png", callback);
  };

  testCase.jasmine = {
    "expect": expect,
    "fail": fail
  };
}

function qmlTest(load, name) {
  describe(name, function() {
    var tests = readTests(load, name);
    tests.forEach(function(test) {
      it(test.name, function(done) {
        var qml = load(name, this.div);
        var div = this.div;
        var testCase = qml.children[test.index];
        console.log("PATH: ", load.path);
        applyTestFunctions(load.path + name, testCase);

        console.log("Test started");
        testCase.start(done);
      });
    });
  });
}

describe('Test.TestCase', function() {
  setupDivElement();
  var load = prefixedQmlLoader('Tests/qml/');
  var renderTest = prefixedRenderTester('Tests/qml/');
  it("should execute tests in order", function(done) {
    var qml = load("TestSequence", this.div, {
      paths: [
        ["common", "/base/tests/qml"]
      ]
    });

    expect(qml.value).toBe(1);
    var test1 = qml.children[0];
    applyTestFunctions(load.path, test1);
    var test2 = qml.children[1];
    applyTestFunctions(load.path, test2);
    test1.start(function() {
      expect(qml.value).toBe(2);
      test2.start(function() {
        expect(qml.value).toBe(3);
        done();
      });
    });

  });

  qmlTest(load, "BasicTestCase");
  qmlTest(load, "SimpleRenderTest");
  qmlTest(load, "TestRenderTest");
  qmlTest(load, "ImageTest");
  qmlTest(load, "TestManyRenders");
});
