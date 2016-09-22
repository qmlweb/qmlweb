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
});
