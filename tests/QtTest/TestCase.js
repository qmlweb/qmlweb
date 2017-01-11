describe("QtTest", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtTest/qml/TestCase");

  it("Empty", function() {
    load("Empty", this.div);
    var tests = QmlWeb.engine.tests;
    expect(tests.total).toBe(1);
    expect(tests.completed).toBe(1);
    expect(tests.stats.pass).toBe(2);
    expect(tests.stats.fail).toBe(0);
    expect(tests.stats.skip).toBe(0);
  });

  it("Simple", function() {
    load("Simple", this.div);
    var tests = QmlWeb.engine.tests;
    expect(tests.total).toBe(1);
    expect(tests.completed).toBe(1);
    expect(tests.stats.pass).toBe(4);
    expect(tests.stats.fail).toBe(1);
    expect(tests.stats.skip).toBe(1);
  });

  it("Datadriven", function() {
    load("Datadriven", this.div);
    var tests = QmlWeb.engine.tests;
    expect(tests.total).toBe(1);
    expect(tests.completed).toBe(1);
    expect(tests.stats.pass).toBe(6);
    expect(tests.stats.fail).toBe(2);
    expect(tests.stats.skip).toBe(1);
  });

  it("API", function() {
    var qml = load("Empty", this.div);
    expect(function() {
      qml.compare(4, 2 + 2, "Compare");
    }).not.toThrow();
    expect(function() {
      qml.compare(5, 2 + 2, "Compare");
    }).toThrowError("Compare");
    expect(function() {
      qml.warn("Warning");
    }).not.toThrow();
    expect(function() {
      qml.verify(true, "True");
    }).not.toThrow();
    expect(function() {
      qml.verify(false, "False");
    }).toThrowError();
  });
});

