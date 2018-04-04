describe("QMLEngine.basepath", function() {
  setupDivElement();
  var webroot = "/base/tests/QMLEngine/basepath/";

  // this checks the case of evalling properties during component init
  // when this component is imported from another directory
  // followed by loading of component in current directory
  it("engine.$basePath is not corrupted after recursive properties eval",
    function() {
      var qml = loadQmlFile(webroot + "test.qml", this.div);
    }
  );
});
