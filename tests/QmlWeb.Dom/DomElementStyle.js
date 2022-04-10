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

  it("updates sizes", function() {
    var qml = load("Style", this.div);
    qml.style.width = "150px";
    qml.style.height = "40px";
    expect(qml.dom.style.width).toBe("150px");
    expect(qml.dom.getBoundingClientRect().width).toBe(150);
    expect(qml.width).toBe(150);
    expect(qml.dom.getBoundingClientRect().height).toBe(40);
    expect(qml.height).toBe(40);
  });

  it("updates implicit sizes", function() {
    var qml = load("Style", this.div);
    var spy = jasmine.createSpy();
    qml.implicitWidthChanged.connect(spy);
    qml.text = "Hello world!";
    expect(spy).toHaveBeenCalled();
  });
});
