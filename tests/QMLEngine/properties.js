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

  it('alias have changed signal', function() {
    var qml = loader('AliasChanged', this.div);
    qml.go();
    expect(qml.childX).toBe(44);
    expect(qml.log).toBe("childX changed to 44!");
    qml.go(); // second call should not call changed signal again
    expect(qml.log).toBe("childX changed to 44!");
  });

  it('alias to id', function() {
    var qml = loader('AliasToId', this.div);
    expect(qml.childA.x).toBe(125);
  });

  it('alias to id with same name', function() {
    var qml = loader('AliasToIdSameName', this.div);
    expect(qml.child.x).toBe(125);
  });


  it('can be named signal', function() {
    var div = loader('NamedSignal', this.div).dom;
  });
});
