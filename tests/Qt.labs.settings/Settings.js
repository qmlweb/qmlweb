describe("Qt.labs.settings.Settings", function() {
  setupDivElement();
  var load = prefixedQmlLoader("Qt.labs.settings/qml/Settings");

  it("Set plain", function() {
    var qml = load("Plain", this.div);
    qml.a = 100;
    qml.b = "foo";
    expect(qml.a).toBe(100);
    expect(qml.b).toBe("foo");
    qml.a = 20;
    qml.b = "bar";
    expect(qml.a).toBe(20);
    expect(qml.b).toBe("bar");
  });

  it("Get plain", function() {
    var qml = load("Plain", this.div);
    expect(qml.a).toBe(20);
    expect(qml.b).toBe("bar");
  });

  it("Set alias", function() {
    var qml = load("Alias", this.div);
    qml.width = 100;
    qml.height = 100;
    expect(qml.width).toBe(100);
    expect(qml.height).toBe(100);
    qml.width = 20;
    qml.height = 30;
    expect(qml.width).toBe(20);
    expect(qml.height).toBe(30);
  });

  it("Get alias", function() {
    var qml = load("Alias", this.div);
    expect(qml.width).toBe(20);
    expect(qml.height).toBe(30);
  });
});
