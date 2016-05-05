describe('QMLEngine.basic', function() {
  it('present', function() {
    expect(!!QMLEngine).toBe(true);
  });

  setupDivElement();
  var load = prefixedQmlLoader('QMLEngine/qml/Basic');
  it('createQmlObject', function() {
    var qml = load('CreateQmlObject', this.div);
    expect(qml.children.length).toBe(1);
    expect(qml.children[0].q).toBe(22);
    expect(this.div.innerText).toBe("variable from context = 42");
  });

  it('Component.onCompleted handlers of dynamically created objects get called',
    function() {
      var qml = load('CompletedOfDynamicObjects', this.div);
      expect(qml.children.length).toBe(1);
      expect(qml.color).toBe('cyan');
    }
  );

  it('Qt.resolvedUrl', function() {
    var qml = load('ResolvedUrl', this.div);
    expect(qml.outer).toBe('/base/tests/');
    expect(qml.current).toBe(qml.outer + 'QMLEngine/qml/');
    expect(qml.inner1).toBe(qml.current + 'foo/bar');
    expect(qml.inner2).toBe(qml.current + 'foo/bar/');
    expect(qml.inner3).toBe(qml.current + 'foo/foo/lol/');
    expect(qml.full).toBe('http://example.com/bar');
  });
});
