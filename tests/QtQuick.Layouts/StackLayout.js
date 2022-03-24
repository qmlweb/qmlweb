describe("QtQuick.Layouts.StackLayout", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick.Layouts/qml/");

  it("sets implicit sizes", function() {
    var qml = load("StackLayout", this.div);

    expect(qml.implicitHeight).toBe(300);
    expect(qml.implicitWidth).toBe(200);
  });

  it("respects fillWidth and fillHeight policy", function() {
    var qml = load("StackLayout", this.div);

    qml.width = 800;
    qml.height = 600;
    qml.layoutChildren();
    expect(qml.children[0].width).toBe(800);
    expect(qml.children[0].height).toBe(600);
    qml.children[0].$Layout.fillWidth = false;
    expect(qml.children[0].width).toBe(200);
    qml.children[0].$Layout.fillHeight = false;
    expect(qml.children[0].height).toBe(300);
  });

  it("only displays the current item", function() {
    var qml = load("StackLayout", this.div);

    expect(qml.children[0].visible).toBe(true);
    expect(qml.children[1].visible).toBe(false);
    qml.currentIndex = 1;
    expect(qml.children[1].visible).toBe(true);
    expect(qml.children[0].visible).toBe(false);
    qml.currentIndex = 2;
    expect(qml.children[1].visible).toBe(false);
    expect(qml.children[0].visible).toBe(false);
  });
});
