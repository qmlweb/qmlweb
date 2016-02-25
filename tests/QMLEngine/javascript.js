describe('QMLEngine.javascript', function() {
  var loader = prefixedQmlLoader('QMLEngine/qml/Javascript');
  it('can be parsed', function() {
    var div = loader('BasicSyntax');
    div.remove()
  });

  it('can parse regexp', function() {
    var qml = loader('Regexp').qml;
    expect("toto".match(qml.reg)).toBe(null);
    expect("4242/firstsecond".match(qml.reg)).not.toBe(null);
    qml.dom.remove();
  });
});

