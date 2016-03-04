describe('QtQuick.Item', function() {
  setupDivElement();
  var loader = prefixedQmlLoader('QtQuick/qml/Item');

  it('Empty', function() {
    var qml = loader('Empty', this.div);
    expect(this.div.innerHTML).toBe('');
    expect(this.div.style.backgroundColor).toBe('');
  });
  it('Size', function() {
    var qml = loader('Size', this.div);
    expect(this.div.offsetWidth).toBe(200);
    expect(this.div.offsetHeight).toBe(100);
    expect(this.div.clientWidth).toBe(200);
    expect(this.div.clientHeight).toBe(100);
  });
});
