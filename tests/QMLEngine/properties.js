describe('QMLEngine.properties', function() {
  setupDivElement();
  var load = prefixedQmlLoader('QMLEngine/qml/Properties');

  it('can store values', function() {
    var qml = load('Basic', this.div);
    expect(qml.intProperty).toBe(10);
    expect(qml.doubleProperty).toBe(0.5);
    expect(qml.stringProperty).toBe("hello");
    expect(qml.itemProperty.x).not.toBe(undefined);
    expect(qml.arrayProperty).toEqual([1, 2, "bar"]);
    expect(qml.hexProperty).toEqual(255);
    expect(qml.octProperty).toEqual(63);
    expect(qml.bigNumber).toEqual(100000000);
  });

  it('undefined property has undefined value', function() {
    var qml = load('Undefined', this.div);
    expect(qml.theUndefined).toEqual(undefined);
    expect(typeof qml.theUndefined).toEqual("undefined");
  });

  it('can be aliased', function() {
    var qml = load('Alias', this.div);
    expect(qml.childX).toBe(125);
  });

  it('alias have changed signal', function() {
    var qml = load('AliasChanged', this.div);
    qml.go();
    expect(qml.childX).toBe(44);
    expect(qml.log).toBe("childX changed to 44!");
    qml.go(); // second call should not call changed signal again
    expect(qml.log).toBe("childX changed to 44!");
  });

  it('alias to id', function() {
    var qml = load('AliasToId', this.div);
    expect(qml.childA.x).toBe(125);
  });

  it('alias to id with same name', function() {
    var qml = load('AliasToIdSameName', this.div);
    expect(qml.child.x).toBe(125);
  });


  it('can be named signal', function() {
    load('NamedSignal', this.div);
  });

  /* in Qml, when assigning non-string value to string property,
     is convert's new value to string. */
  it('StringConversion', function() {
    var qml = load('StringConversion');

    expect(qml.stringA).toBe("10");
    expect(typeof qml.stringA).toBe("string");

    //console.log("qml.stringB=", qml.stringB, typeof qml.stringB);
    expect(qml.stringB).toBe("11");
    expect(typeof qml.stringB).toBe("string");
    qml.reassign();
    expect(qml.stringA).toBe("333");
    expect(typeof qml.stringA).toBe("string");
  });

  it('ChangedSignal', function() {
    var qml = load('ChangedSignal', this.div);
    expect(qml.result).toBe(69);
  });

  it('ChangedExpressionSignal', function() {
    var qml = load('ChangedExpressionSignal', this.div);
    expect(qml.counter).toBe(1);
  });
});
