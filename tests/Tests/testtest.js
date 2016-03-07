function contextVariable(obj, name) {
  return obj.$context[name];
}

describe('Test.TestCase2', function() {
  setupDivElement();
  var load = prefixedQmlLoader('Tests/');
  //var compare = prefixedRenderTester("Tests/").compare;
  it("works", function(done) {
    var qml = load("TestCase2", this.div);
    var div = this.div;


    console.log(qml.compareRender);
    var test = contextVariable(qml, "test");
    test.compareRender = function(name, callback) {
      console.log("compare", name)
      var path = load.path + "TestCase2"
      if(name !== ""){
        path += "-" + name;
      }
      return compareScreenshot(div, path + ".png", callback);
    };
    test.jasmine = {
      "expect": expect,
      "done": done
    };
    qml.start();
    test.start();
  });
});
