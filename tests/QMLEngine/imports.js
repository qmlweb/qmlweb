describe('QMLEngine.imports', function() {
  setupDivElement();
  var loader = prefixedQmlLoader('QMLEngine/qml/Import');

  it('Javascript', function() {
    var qml = loader('Javascript', this.div);
    var div = qml.dom;
    expect(div.offsetWidth).toBe(20);
    expect(div.offsetHeight).toBe(10);
    expect(div.style.backgroundColor).toBe('magenta');
  });
});
