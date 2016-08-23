describe("QtQuick.MouseArea", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QtQuick/qml/MouseArea");

  it("onClicked", function() {
    var qml = load("Generic", this.div);
    expect(qml.clicks).toBe(0);
    sendEvent(qml.area.dom, "click");
    expect(qml.clicks).toBe(1);
    sendEvent(qml.area.dom, "click");
    sendEvent(qml.area.dom, "click");
    expect(qml.clicks).toBe(3);
    qml.area.enabled = false;
    sendEvent(qml.area.dom, "click");
    sendEvent(qml.area.dom, "click");
    expect(qml.clicks).toBe(3);
    qml.area.enabled = true;
    expect(qml.clicks).toBe(3);
    sendEvent(qml.area.dom, "click");
    expect(qml.clicks).toBe(4);
  });

  it("CotainsMouse", function() {
    var qml = load("Generic", this.div);
    expect(qml.area.containsMouse).toBe(false);
    sendEvent(qml.area.dom, "mouseover", 0, 0);
    expect(qml.area.containsMouse).toBe(true);
    sendEvent(qml.area.dom, "mouseover", 10, 0);
    expect(qml.area.containsMouse).toBe(true);
    sendEvent(qml.area.dom, "mouseout", 0, 10);
    expect(qml.area.containsMouse).toBe(false);
    sendEvent(qml.area.dom, "mouseover", 10, 10);
    expect(qml.area.containsMouse).toBe(true);
    sendEvent(qml.area.dom, "mouseout", 0, 0);
    expect(qml.area.containsMouse).toBe(false);
  });

  it("ClickOutside", function() {
    var qml = load("Generic", this.div);
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
