describe("QtQml.Types", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQml/qml/Types");

  it("Color", function() {
    var qml = load("Color", this.div);
    expect(qml.trueTests[0]).toBe(true);
    expect(qml.trueTests[1]).toBe(true);
    expect(qml.trueTests[2]).toBe(true);
    expect(qml.falseTests[0]).toBe(false);
    expect(qml.falseTests[1]).toBe(false);
    expect(qml.falseTests[2]).toBe(false);
  });
});
