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
    expect(this.div.innerText).toBe("I am an item created by createQmlObject");
  });

  it('Component.onCompleted handlers of dynamically created objects get called', function() {
    var qml = load('CompletedOfDynamicObjects', this.div);
    expect(qml.children.length).toBe(1);
    expect(qml.color).toBe('cyan');
  });
});
