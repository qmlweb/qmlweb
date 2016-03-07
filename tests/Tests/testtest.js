function contextVariable(obj, name) {
  return obj.$context[name];
}

describe('Test.TestCase2', function() {
  setupDivElement();
  var load = prefixedQmlLoader('Tests/');
  it("works", function(done) {
    var qml = load("TestCase2", this.div);
    var test = contextVariable(qml, "test");
    test.jasmine = {
      "expect": expect
    };
    test.start()
  });
});
