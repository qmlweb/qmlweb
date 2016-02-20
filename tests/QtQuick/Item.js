describe('QtQuick.Item', function() {
  var loader = prefixedQmlLoader('QtQuick/qml/Item');
  it('Empty', function() {
    var div = loader('Empty');
    expect(div.innerHTML).toBe('');
    expect(div.style.backgroundColor).toBe('');
    div.remove();
  });
  it('Size', function() {
    var div = loader('Size');
    expect(div.offsetWidth).toBe(200);
    expect(div.offsetHeight).toBe(100);
    expect(div.clientWidth).toBe(200);
    expect(div.clientHeight).toBe(100);
    div.remove();
  });
});
