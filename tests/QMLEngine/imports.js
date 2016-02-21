describe('QMLEngine.imports', function() {
  var loader = prefixedQmlLoader('QMLEngine/qml/Import');
  it('Javascript', function() {
    var div = loader('Javascript');
    expect(div.offsetWidth).toBe(20);
    expect(div.offsetHeight).toBe(10);
    expect(div.style.backgroundColor).toBe('magenta');
    div.remove();
  });
});
