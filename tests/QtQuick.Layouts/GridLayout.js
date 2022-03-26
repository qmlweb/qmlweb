describe("QtQuick.Layouts.ColumnLayout", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick.Layouts/qml/GridLayout");

  it("TopToBottom", function() {
    var qml = load("TopToBottom", this.div);
    expect(qml.implicitWidth).toBe(415);
    expect(qml.implicitHeight).toBe(310);
    expect(qml.children[1].x).toBe(0);
    expect(qml.children[1].y).toBe(0);
    expect(qml.children[2].x).toBe(0);
    expect(qml.children[2].y).toBe(105);
  });
  it("TopToBottom flow, direction RightToLeft", function() {
    var qml = load("TopToBottom", this.div);
    qml.layoutDirection = QmlWeb.Qt.RightToLeft;
    expect(qml.children[1].x).toBe(315);
    expect(qml.children[1].y).toBe(0);
    expect(qml.children[2].x).toBe(315);
    expect(qml.children[2].y).toBe(105);
  });
  it("LeftToRight", function() {
    var qml = load("LeftToRight", this.div);
    expect(qml.implicitWidth).toBe(310);
    expect(qml.implicitHeight).toBe(415);
    expect(qml.children[1].x).toBe(0);
    expect(qml.children[1].y).toBe(0);
    expect(qml.children[2].x).toBe(105);
    expect(qml.children[2].y).toBe(0);
  });
  it("LeftToRight flow, direction RightToLeft", function() {
    var qml = load("LeftToRight", this.div);
    qml.layoutDirection = QmlWeb.Qt.RightToLeft;
    expect(qml.children[1].x).toBe(210);
    expect(qml.children[1].y).toBe(0);
    expect(qml.children[2].x).toBe(105);
    expect(qml.children[2].y).toBe(0);
  });
  it("Fills margins", function() {
    var qml = load("Fill", this.div);
    expect(qml.children[1].width).toBe(100);
    expect(qml.children[1].x).toBe(0);
    expect(qml.children[1].y).toBe(0);
    expect(qml.children[2].x).toBe(150);
    expect(qml.children[2].y).toBe(0);
  });
  it("Fills items", function() {
    var qml = load("Fill", this.div);
    qml.children[1].$Layout.fillWidth = true;
    expect(qml.children[1].width).toBe(445 - 210);
    qml.children[5].$Layout.fillWidth = true;
    expect(qml.children[1].width).toBe(167.5);
    expect(qml.children[5].width).toBe(167.5);
  });
  it("Fills with column span", function() {
    var qml = load("Fill", this.div);
    qml.children[1].$Layout.fillWidth = true;
    qml.children[1].$Layout.columnSpan = 2;
    expect(qml.children[1].width).toBe(290);
  });
  it("Fills with column span and implicit width", function() {
    var qml = load("LeftToRight", this.div);
    qml.children[1].$Layout.fillWidth = true;
    qml.children[1].$Layout.columnSpan = 2;
    expect(qml.children[1].width).toBe(200);
  });
  it("Column span", function() {
    var qml = load("LeftToRight", this.div);
    expect(qml.children[3].y).toBe(0);
    qml.children[1].$Layout.columnSpan = 2;
    expect(qml.children[3].y).toBe(105);
  });
  it("Row span", function() {
    var qml = load("LeftToRight", this.div);
    expect(qml.children[4].x).toBe(0);
    qml.children[1].$Layout.rowSpan = 2;
    expect(qml.children[4].x).toBe(105);
  });
});
