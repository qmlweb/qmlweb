describe('QMLEngine.imports', function() {
  setupDivElement();
  var load = prefixedQmlLoader('QMLEngine/qml/Import');

  it('Javascript', function() {
    load('Javascript', this.div);
    expect(this.div.offsetWidth).toBe(20);
    expect(this.div.offsetHeight).toBe(10);
    expect(this.div.style.backgroundColor).toBe('magenta');
  });
  it('Qmldir', function() {
    load('Qmldir', this.div);
    expect(this.div.offsetWidth).toBe(50);
    expect(this.div.offsetHeight).toBe(100);
    expect(this.div.style.backgroundColor).toBe('green');
    // #0ff and cyan doesn't work, because PhantomJS converts
    // them to rgb( 0,255,255 ).. how to compare colors?..
  });

  it("ImportPath", function() {
    load("AddImportPath", this.div, {
      paths: ["/base/tests/QMLEngine/qml/somefolder"]
    });
  });
});
