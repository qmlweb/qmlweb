describe("QtQuick.Repeater", function() {
  setupDivElement();

  var load = prefixedQmlLoader("QtQuick/qml/Repeater");
  it("reflect ListModel changes", function() {
    var qml = load("ListModel", this.div);
    var r = qml.repeater;
    var model = r.model;

    model.append({
      role1: "foo",
      role2: 42
    });

    expect(r.itemAt(0).firstRole).toBe("foo");
    expect(r.itemAt(0).secondRole).toBe(42);

    model.append({
      role1: "bar",
      role2: 43
    });

    expect(r.count).toBe(2);
    expect(r.itemAt(1).firstRole).toBe("bar");
    expect(r.itemAt(1).secondRole).toBe(43);

    model.set(0, {
      role1: "fizz",
      role2: 44
    });

    expect(r.itemAt(0).firstRole).toBe("fizz");
    expect(r.itemAt(0).secondRole).toBe(44);

    model.setProperty(1, "role1", "bizz");

    expect(r.itemAt(1).firstRole).toBe("bizz");
    expect(r.itemAt(1).secondRole).toBe(43);

    model.move(0, 1, 1);

    expect(r.itemAt(0).firstRole).toBe("bizz");
    expect(r.itemAt(0).secondRole).toBe(43);

    model.remove(0);

    expect(r.count).toBe(1);
    expect(r.itemAt(0).firstRole).toBe("fizz");
    expect(r.itemAt(0).secondRole).toBe(44);

    model.clear();

    expect(r.count).toBe(0);
  });

  it("reflect number model changes", function() {
    var qml = load("NumberModel", this.div);
    var r = qml.repeater;
    expect(r.count).toBe(0);
    r.model = 2;
    expect(r.count).toBe(2);
    r.model = 1;
    expect(r.count).toBe(1);
    r.model = 2;
    expect(r.count).toBe(2);
    r.model = 0;
    expect(r.count).toBe(0);
  });

  it("delegate onCompleted and onDestruction called", function() {
    var qml = load("CompletedDestruction", this.div);
    expect(qml.internal_created).toBe(3);
    expect(qml.internal_destroyed).toBe(3);
  });

  it("model role", function() {
    var qml = load("ModelRole", this.div);
    var r = qml.repeater;

    expect(r.itemAt(0).firstRole).toBe("foo");
    expect(r.itemAt(0).secondRole).toBe(42);
    expect(r.itemAt(0).firstRoleInner).toBe("foo");
    expect(r.itemAt(0).secondRoleInner).toBe(42);

    expect(r.itemAt(1).firstRole).toBe("bar");
    expect(r.itemAt(1).secondRole).toBe(43);
    expect(r.itemAt(1).firstRoleInner).toBe("bar");
    expect(r.itemAt(1).secondRoleInner).toBe(43);
  });

  it("handle delegate property and role name conflict", function() {
    var qml = load("PropertyRoleNameConflict", this.div);
    var r = qml.repeater;

    expect(r.itemAt(0).roleName).toBe("bar");
    expect(r.itemAt(0).implicitRoleNameReference).toBe("bar");
    expect(r.itemAt(0).explicitRoleNameReference).toBe("foo");
  });
});
