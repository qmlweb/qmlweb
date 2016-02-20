describe('QtQuick.Rectangle', function() {
  var loader = prefixedQmlLoader('QtQuick/qml/Rectangle');
  it('White', function() {
    var div = loader('White');
    expect(div.innerHTML).toBe('');
    expect(div.style.backgroundColor).toBe('white');
    expect(div.offsetWidth).toBe(200);
    expect(div.offsetHeight).toBe(100);
    expect(div.clientWidth).toBe(200);
    expect(div.clientHeight).toBe(100);
    div.remove();
  });
  it('Color', function() {
    var div = loader('Color');
    expect(div.style.backgroundColor).toBe('red');
    div.remove();
  });
  it('Transparent', function() {
    var div = loader('Transparent');
    expect(div.style.backgroundColor).toBe('transparent');
    div.remove();
  });
});
