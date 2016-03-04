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
  it('Qmldir', function() {
    loader('Qmldir', this.div);
    expect(this.div.offsetWidth).toBe(50);
    expect(this.div.offsetHeight).toBe(100);
    expect(this.div.style.backgroundColor).toBe('green');
    // #0ff and cyan doesn't work, because PhantomJS converts
    // them to rgb( 0,255,255 ).. how to compare colors?..
  });
});
