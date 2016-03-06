function contextVariable(obj, name) {
  return obj.$context[name];
}

describe('QMLEngine.scope', function() {
  setupDivElement();
  var load = prefixedQmlLoader('QMLEngine/qml/Scope');
  it('can reference parent items id', function() {
    var qml = load('Root', this.div);
    var parentItem = contextVariable(qml, "parentItem");
    expect(parentItem).not.toBe(undefined);
    expect(parentItem.$context).not.toBe(undefined);
    var childA = contextVariable(parentItem, "childA");
    expect(childA).not.toBe(undefined);
    var childB = contextVariable(parentItem, "childB");
    expect(childB).not.toBe(undefined);
    expect(childA.parentValue).toBe(100);
    expect(childA.rootValue).toBe(1000);
    expect(parentItem.sum).toBe(6600);
  });

  it('can reference inherited properties from parent (upflow)', function() {
    var qml = load("Upflow", this.div);
    var child = contextVariable(qml, "child");
    expect(child.thisFoo).toBe(15);
  });

  it('can reference sibling items by id', function() {
    var qml = load('Sibling', this.div);
    var childB = contextVariable(qml, "childB");
    expect(childB.value).toBe(4);
  });
});
