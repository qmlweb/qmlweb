describe("QtQml.Binding", function() {
  setupDivElement();

  var load = prefixedQmlLoader("QtQml/qml/Binding");
  it("one way binding", function() {
    var qml = load("OneWay", this.div);
    qml.sourceValue = 50;
    expect(qml.targetValue).toBe(50);
  });

  it("one way binding - when", function() {
    var qml = load("OneWay", this.div);
    qml.when = false;
    qml.sourceValue = 50;
    expect(qml.targetValue).toBe(0);

    qml.when = true;
    expect(qml.targetValue).toBe(50);
  });

  it("two way binding", function() {
    var qml = load("TwoWay", this.div);
    qml.sourceValue = 50;
    expect(qml.targetValue).toBe(50);
    qml.targetValue = 23;
    expect(qml.sourceValue).toBe(23);
  });

  it("two way binding - when", function() {
    var qml = load("TwoWay", this.div);
    qml.when = false;
    qml.sourceValue = 50;
    expect(qml.targetValue).toBe(0);
    qml.targetValue = 10;
    qml.when = true;
    expect(qml.targetValue).toBe(50); // note: the first binding applies first
    qml.targetValue = 10;
    expect(qml.sourceValue).toBe(10);
  });

  it("broken binding", function() {
    var qml = load("Broken", this.div);
    expect(qml.targetValue).toBe(0);
    qml.when = true;
    expect(qml.targetValue).toBe(0); // should not override anything
  });

  it("binding undefined var", function() {
    var qml = load("Undefined", this.div);
    qml.sourceValue = undefined;
    expect(qml.targetValue).toBe(undefined);
  });
});
