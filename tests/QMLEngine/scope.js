function contextVariable(obj, name) {
  return obj.$context[name];
}

describe("QMLEngine.scope", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QMLEngine/qml/Scope");
  it("can reference parent items id", function() {
    var qml = load("Root", this.div);
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

  it("can reference inherited properties from parent (upflow)", function() {
    var qml = load("Upflow", this.div);
    var child = contextVariable(qml, "child");
    expect(child.thisFoo).toBe(15);
  });

  it("can reference sibling items by id", function() {
    var qml = load("Sibling", this.div);
    var childB = contextVariable(qml, "childB");
    expect(childB.value).toBe(4);
  });

  it("local var assigns doesnt kill properties", function() {
    var qml = load("SafeFromLocals", this.div);
    expect(qml.a).toBe("333");
    expect(qml.b).toBe("b_init_value");
    expect(qml.c).toBe("");
    expect(qml.d).toBe("3local");
  });

  it("chained property assign is possible", function() {
    var qml = load("SafeFromLocals", this.div);
    expect(qml.p).toBe(17);
    expect(qml.q).toBe(17);
  });

  it("object id should override same-named property of base object",
    function() {
      var qml = load("Override", this.div);
      expect(qml.getFooWidth()).toBe(200);
    }
  );

  it("object id should NOT override same-named property in base object scope",
    function() {
      var qml = load("Override", this.div);
      expect(qml.getFooVal()).toBe(42);
    }
  );

  it("item id should NOT change property value with the same name",
    function() {
      var qml = load("IdOverProperty", this.div);
      expect(qml.boo).toBe("42");
    }
  );

  it("item id of a component should be in scope",
    function() {
      var qml = load("ComponentId", this.div);
      expect(qml.bar).toBe(42);
    }
  );

  it("delegates in Repeaters have roles in scope",
    function(done) {
      var qml = load("Repeater", this.div);
      qml.yield = function(width) {
        expect(width).toBe(200);
        done();
      };
    }
  );
});
