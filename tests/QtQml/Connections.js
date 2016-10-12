describe("QtQml.Connections", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQml/qml/Connections");

  it("Connections default target is parent", function() {
    var qml = load("Connections", this.div);
    expect(qml.connections.target).toBe(qml);
    qml.value = 1;
    expect(qml.test_value).toBe(1);
  });

  it("Connections target change", function() {
    var qml = load("Connections", this.div);
    qml.connections.target = qml.new_target;
    qml.new_target.value = 1;
    expect(qml.test_value).toBe(1);
  });

  it("Connections null target", function() {
    var qml = load("Connections", this.div);
    qml.connections.target = null;
    qml.value = 1;
    expect(qml.test_value).toBe(0);
  });
});
