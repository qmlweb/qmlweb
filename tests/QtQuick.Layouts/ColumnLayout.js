describe("QtQuick.Layouts.ColumnLayout", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick.Layouts/qml/ColumnLayout");

  it("sets implicit sizes", function() {
    var qml = load("ImplicitSize", this.div);

    expect(qml.implicitHeight).toBe(20 + 21 + 23);
    expect(qml.implicitWidth).toBe(31);
  });

  it("update layout on children change", function() {
    var qml = load("ImplicitSize", this.div);

    qml.children[0].implicitHeight += 10;
    expect(qml.implicitHeight).toBe(20 + 21 + 23 + 10);
  });

  it("should fill width based on max item width", function() {
    var qml = load("ImplicitSize", this.div);

    qml.children[0].Layout.fillWidth = true;
    expect(qml.children[0].width).toBe(31);
  });

  it("should fill width based on layout width", function() {
    var qml = load("ImplicitSize", this.div);

    qml.children[0].Layout.fillWidth = true;
    qml.width = 200;
    expect(qml.children[0].width).toBe(200);
  });

  it("should fill height based on layout height", function() {
    var qml = load("ImplicitSize", this.div);

    qml.children[0].Layout.fillHeight = true;
    qml.height = 200;
    expect(qml.children[0].height).toBe(200 - 21 - 23);
  });

  it("should align items using Qt.LeftToRight", function() {
    var qml = load("ImplicitSize", this.div);

    for (let i = 2; i >= 0; --i) {
      expect(qml.children[i].x).toBe(0);
    }
  });

  it("should align items using Qt.RightToLeft", function() {
    var qml = load("ImplicitSize", this.div);

    qml.layoutDirection = QmlWeb.Qt.RightToLeft;
    for (let i = 2; i >= 0; --i) {
      expect(qml.children[i].x + qml.children[i].width).toBe(31);
    }
  });
});
