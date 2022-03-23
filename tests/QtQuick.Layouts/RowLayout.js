describe("QtQuick.Layouts.RowLayout", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick.Layouts/qml/RowLayout");

  it("sets implicit sizes", function() {
    var qml = load("ImplicitSize", this.div);

    expect(qml.implicitWidth).toBe(30 + 21 + 31);
    expect(qml.implicitHeight).toBe(25);
  });

  it("update layout on children change", function() {
    var qml = load("ImplicitSize", this.div);

    qml.children[1].Layout.preferredWidth += 10;
    expect(qml.implicitWidth).toBe(30 + 21 + 31 + 10);
  });

  it("should fill height based on max item height", function() {
    var qml = load("ImplicitSize", this.div);

    qml.children[0].Layout.fillHeight = true;
    expect(qml.children[0].height).toBe(25);
  });

  it("should fill height based on layout height", function() {
    var qml = load("ImplicitSize", this.div);

    qml.children[0].Layout.fillHeight = true;
    qml.height = 200;
    expect(qml.children[0].height).toBe(200);
  });

  it("should fill width based on layout width", function() {
    var qml = load("ImplicitSize", this.div);

    qml.children[0].Layout.fillWidth = true;
    qml.width = 200;
    expect(qml.children[0].width).toBe(200 - 21 - 31);
  });

  it("should align items using Qt.LeftToRight", function() {
    var qml = load("ImplicitSize", this.div);

    expect(qml.children[0].x).toBe(qml.x + 0);
    expect(qml.children[1].x).toBe(qml.x + 30);
    expect(qml.children[2].x).toBe(qml.x + 30 + 21);
  });

  it("should align items using Qt.RightToLeft", function() {
    var qml = load("ImplicitSize", this.div);

    qml.layoutDirection = QmlWeb.Qt.RightToLeft;
    expect(qml.children[0].x).toBe(qml.x + 21 + 31);
    expect(qml.children[1].x).toBe(qml.x + 31);
    expect(qml.children[2].x).toBe(qml.x + 0);
  });
});
