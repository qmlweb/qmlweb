describe("QtQuick.ComboBox", function() {
  setupDivElement();
  var webroot = "/base/tests/QtQuick.Controls/ComboBox/";

  it("implicitWidth should change with model", function() {
    var qml = loadQmlFile(webroot + "test.qml", this.div);

    qml.model = ["hello i am a long string!"];
    expect(qml.implicitWidth).toBeGreaterThan(100);

    qml.model = ["hi!"];
    expect(qml.implicitWidth).toBeLessThan(100);

    expect(qml.width).toBe(qml.implicitWidth);
  });

  it("Can specify explicit width for ComboBox", function() {
    var qml = loadQmlFile(webroot + "test.qml", this.div);

    qml.width = 400;
    qml.model = ["hello i am a long string!"];

    expect(qml.width).toBe(400);

    qml.width = 300;
    expect(qml.width).toBe(300);
  });

  it("should auto-select first value", function() {
    var qml = loadQmlFile(webroot + "test.qml", this.div);

    qml.model = ["a", "b", "c"];

    expect(qml.currentText).toBe("a");
    expect(qml.currentIndex).toBe(0);
  });

  it("change of currentIndex should involve change of currentText", function() {
    var qml = loadQmlFile(webroot + "test.qml", this.div);

    qml.model = ["a", "b", "c"];
    qml.currentIndex = 1;
    expect(qml.currentText).toBe("b");
  });

  it("default value of currentIndex should be 0", function() {
    var qml = loadQmlFile(webroot + "test.qml", this.div);

    qml.model = ["a", "b", "c"];
    expect(qml.currentText).toBe("a");
    expect(qml.currentIndex).toBe(0);
  });

  it("initial value of currentIndex should be considered", function() {
    var qml = loadQmlFile(webroot + "test_populated.qml", this.div);

    expect(qml.currentText).toBe("b");
    expect(qml.currentIndex).toBe(1);
  });
});
