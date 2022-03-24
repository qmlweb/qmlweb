describe("QtQuick.PropertyAnimation", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/PropertyAnimation");

  it("Loads", function() {
    load("Loads", this.div);
  });
  xit("FailsToLoad", function() {
    var exception = null;
    try {
      load("FailsToLoad", this.div);
    } catch (err) {
      exception = err;
    }
    expect(exception).not.toBe(null);
    expect(exception.message).toContain(
      "Cannot assign to non-existent default property");
  });
});
