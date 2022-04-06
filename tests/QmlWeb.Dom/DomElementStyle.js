describe("QmlWeb.Dom.DomElement", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QmlWeb.Dom/qml/DomElement");

  it("initalizes style", function() {
    var qml = load("Style", this.div);
    expect(qml.dom.style.textAlign).toBe("center");
  });

  it("updates style", function() {
    var qml = load("Style", this.div);
    qml.style.textAlign = "right";
    expect(qml.dom.style.textAlign).toBe("right");
  });

  it("supports style bindings", function() {
    var qml = load("Style", this.div);
    expect(qml.dom.style.fontSize).toBe("21px");
    qml.bindSize = 14;
    expect(qml.style.fontSize).toBe("14px");
    expect(qml.dom.style.fontSize).toBe("14px");
  });

  it("updates implicit sizes", function() {
    var qml = load("Style", this.div);
    qml.style.width = "150px";
    qml.style.height = "40px";
    expect(qml.implicitWidth).toBe(150);
    expect(qml.implicitHeight).toBe(40);
  });
});
