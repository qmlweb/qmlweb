describe("QtQuick.MouseArea", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/MouseArea");

  it("ClickOutside", function() {
    var qml = load("ClickOutside", this.div);
    expect(qml.pressed).toBe(false);
    sendEvent(qml.area.dom, "mousedown", 0, 0);
    expect(qml.pressed).toBe(true);
    sendEvent(qml.area.dom, "mouseup", 0, 0);
    expect(qml.pressed).toBe(false);
    sendEvent(qml.area.dom, "mousedown", 0, 0);
    expect(qml.pressed).toBe(true);
    sendEvent(document.body, "mouseup", 11, 11);
    expect(qml.pressed).toBe(false);
  });
});
