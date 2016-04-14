describe('QMLEngine.imports', function() {
  setupDivElement();
  var load = prefixedQmlLoader('QMLEngine/qml/Import');

  it('Javascript', function() {
    load('Javascript', this.div);
    expect(this.div.offsetWidth).toBe(20);
    expect(this.div.offsetHeight).toBe(10);
    expect(this.div.style.backgroundColor).toBe('rgb(255, 0, 255)');
  });
  it('Qmldir', function() {
    load('Qmldir', this.div);
    expect(this.div.offsetWidth).toBe(50);
    expect(this.div.offsetHeight).toBe(100);
    expect(this.div.style.backgroundColor).toBe('green');
    // #0ff and cyan doesn't work, because PhantomJS converts
    // them to rgb( 0,255,255 ).. how to compare colors?..
  });
  it("can import from sibling directory", function() {
    var qml = load("From/SiblingDir", this.div);
    expect(qml.text).toBe("I'm simple");
  });
  it("can import from parent directory", function() {
    var qml = load("From/ParentDir", this.div);
    expect(qml.value).toBe(5);
  });
  it("can import from directory without qmldir file", function() {
    var qml = load("NoQmldir", this.div);
    expect(qml.value).toBe(67);
  });

});
