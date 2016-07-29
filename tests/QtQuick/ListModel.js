describe("QtQuick.ListModel", function() {
  setupDivElement();

  var load = prefixedQmlLoader("QtQuick/qml/");
  it("can append a new item", function() {
    var qml = load("ListModel", this.div);
    var oldCount = qml.count;
    qml.append({ cost: 5.95, name: "Pizza" });
    expect(qml.count).toBe(oldCount + 1);
  });

  it("can append an array of items", function() {
    var qml = load("ListModel", this.div);
    var oldCount = qml.count;
    qml.append([
      { cost: 5.95, name: "Pizza" },
      { cost: 9.95, name: "Chicken" }
    ]);
    expect(qml.count).toBe(oldCount + 2);
  });

  it("can insert an item at a given position", function() {
    var qml = load("ListModel", this.div);
    qml.insert(2, { cost: 5.95, name: "Pizza" });
    expect(qml.get(2).cost).toBe(5.95);
  });

  it("can move items in the list", function() {
    var qml = load("ListModel", this.div);
    var firstName = qml.get(0).name;
    var secondName = qml.get(1).name;
    var thirdName = qml.get(2).name;
    qml.move(0, 1, 2);
    expect(qml.get(0).name).toBe(thirdName);
    expect(qml.get(1).name).toBe(firstName);
    expect(qml.get(2).name).toBe(secondName);
  });

  it("can remove an item from its position", function() {
    var qml = load("ListModel", this.div);
    var oldCount = qml.count;
    var oldName = qml.get(0).name;
    qml.remove(0);
    expect(qml.get(0).name).not.toBe(oldName);
    expect(qml.count).toBe(oldCount - 1);
  });

  it("can clear all items", function() {
    var qml = load("ListModel", this.div);
    qml.clear();
    expect(qml.count).toBe(0);
  });

  it("can set properties with the method set", function() {
    var qml = load("ListModel", this.div);
    qml.set(1, { cost: 5.95, name: "Pizza" });
    expect(qml.get(1).cost).toBe(5.95);
    expect(qml.get(1).name).toBe("Pizza");
  });

  it("can set properties with the method setProperty", function() {
    var qml = load("ListModel", this.div);
    qml.setProperty(1, "name", "Pizza");
    expect(qml.get(1).name).toBe("Pizza");
  });
});
