describe('QMLEngine.javascript', function() {
  var loader = prefixedQmlLoader('QMLEngine/qml/Javascript');
  it('can be parsed', function() {
    var div = loader('BasicSyntax');
    div.remove()
  });
});
