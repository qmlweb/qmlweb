describe('QtQuick.Rectangle', function() {
  setupDivElement();
  var loader = prefixedQmlLoader('QtQuick/qml/Rectangle');

  it('White', function() {
    var div = loader('White', this.div).dom;
    expect(div.innerHTML).toBe('');
    expect(div.style.backgroundColor).toBe('white');
    expect(div.offsetWidth).toBe(200);
    expect(div.offsetHeight).toBe(100);
    expect(div.clientWidth).toBe(200);
    expect(div.clientHeight).toBe(100);
  });
  it('Color', function() {
    var qml = loader('Color', this.div);
    expect(this.div.style.backgroundColor).toBe('red');
  });
  it('Transparent', function() {
    var qml = loader('Transparent', this.div);
    expect(this.div.style.backgroundColor).toBe('transparent');
  });
});
