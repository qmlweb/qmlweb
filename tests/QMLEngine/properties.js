describe('QMLEngine.properties', function() {
  setupDivElement();
  var loader = prefixedQmlLoader('QMLEngine/qml/Properties');

  it('can store values', function() {
    var qml = loader('Basic', this.div);
    expect(qml.intProperty).toBe(10);
    expect(qml.doubleProperty).toBe(0.5);
    expect(qml.stringProperty).toBe("hello");
    expect(qml.itemProperty.x).not.toBe(undefined);
    expect(qml.arrayProperty).toEqual([1, 2, "bar"]);
    expect(qml.hexProperty).toEqual(255);
    expect(qml.octProperty).toEqual(63);
    expect(qml.bigNumber).toEqual(100000000);
  });

  it('can be aliased', function() {
    var qml = loader('Alias', this.div);
    expect(qml.childX).toBe(125);
  });

  it('can be named signal', function() {
    expect(function() {
      var div = loader('NamedSignal', this.div).dom;
    }).not.toThrow();
  });
});
