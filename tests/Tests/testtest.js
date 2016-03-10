function contextVariable(obj, name) {
  return obj.$context[name];
}

function qmlTest(load, name) {
  it("QML TEST: " + name, function(done) {
    var qml = load(name, this.div, {
      paths: [["common", "/base/tests/qml"]]
    });
    var div = this.div;
    console.log("TEST", name)
    var test = contextVariable(qml, "test");
    test.compareRender = function(tag, callback) {
      console.log("compare", tag)
      var path = load.path + name
      if(tag !== "") {
        path += "-" + tag;
      }
      return compareScreenshot(div, path + ".png", callback);
    };
    test.jasmine = {
      "expect": expect,
      "done": done
    };
    if(qml.start)
      qml.start();
    test.start();
  });

}

describe('Test.TestCase', function() {
  setupDivElement();
  var load = prefixedQmlLoader('Tests/');
  qmlTest(load, "TestCase");
  //var compare = prefixedRenderTester("Tests/").compare;
  //it("works", function(done) {
    // var qml = load("TestCase", this.div);
    // var div = this.div;
    //
    //
    // console.log(qml.compareRender);
    // var test = contextVariable(qml, "test");
    // test.compareRender = function(name, callback) {
    //   console.log("compare", name)
    //   var path = load.path + "TestCase"
    //   if(name !== "") {
    //     path += "-" + name;
    //   }
    //   return compareScreenshot(div, path + ".png", callback);
    // };
    // test.jasmine = {
    //   "expect": expect,
    //   "done": done
    // };
    // qml.start();
    // test.start();
  //});
});
