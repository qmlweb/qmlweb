describe('QMLEngine.imports', function() {
  var loader = prefixedQmlLoader('QMLEngine/qml/Bindings');
  it('NoSrc', function() {
    var div = loader('NoSrc');
    expect(div.offsetWidth).toBe(10);
    expect(div.offsetHeight).toBe(12);
    div.remove();
  });
});
