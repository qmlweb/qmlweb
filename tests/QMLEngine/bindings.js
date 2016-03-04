describe('QMLEngine.imports', function() {
  setupDivElement();
  var loader = prefixedQmlLoader('QMLEngine/qml/Bindings');

  it('NoSrc', function() {
    var div = loader('NoSrc', this.div).dom;
    expect(div.offsetWidth).toBe(10);
    expect(div.offsetHeight).toBe(12);
  });

  it('update immediately', function() {
    var qml = loader('Update', this.div);
    expect(qml.intB).toBe(20);
    expect(qml.textB).toBe("hello world");
    qml.intA = 5;
    expect(qml.intB).toBe(10);
    qml.textA = "goodbye";
    expect(qml.textB).toBe("goodbye world");
  });
});
