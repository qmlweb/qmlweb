describe('QMLEngine.javascript', function() {
  setupDivElement();
  var loader = prefixedQmlLoader('QMLEngine/qml/Javascript');

  it('can be parsed', function() {
    var qml = loader('BasicSyntax', this.div);
  });

  it('can parse regexp', function() {
    var qml = loader('Regexp', this.div);
    expect("toto".match(qml.reg)).toBe(null);
    expect("4242/firstsecond".match(qml.reg)).not.toBe(null);
  });
});
