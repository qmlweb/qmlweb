describe('QtQuick.Rectangle', function() {
  var load = prefixedQmlLoader('QtQuick/qml/Rectangle');
  var itCanRender = prefixedRenderTester("QtQuick/qml/Rectangle");

  setupDivElement();

  itCanRender("Color");

  it('White', function() {
    load('White', this.div);
    expect(this.div.innerHTML).toBe('');
    expect(this.div.style.backgroundColor).toBe('white');
    expect(this.div.offsetWidth).toBe(200);
    expect(this.div.offsetHeight).toBe(100);
    expect(this.div.clientWidth).toBe(200);
    expect(this.div.clientHeight).toBe(100);
  });

  it('Color', function() {
    load('Color', this.div);
    expect(this.div.style.backgroundColor).toBe('red');
  });

  it('Transparent', function() {
    load('Transparent', this.div);
    expect(this.div.style.backgroundColor).toBe('transparent');
  });
});
