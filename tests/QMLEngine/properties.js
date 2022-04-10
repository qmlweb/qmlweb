describe("QMLEngine.properties", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QMLEngine/qml/Properties");

  it("can store values", function() {
    var qml = load("Basic", this.div);
    expect(qml.intProperty).toBe(10);
    expect(qml.doubleProperty).toBe(0.5);
    expect(qml.stringProperty).toBe("hello");
    expect(qml.itemProperty.x).not.toBe(undefined);
    expect(qml.arrayProperty).toEqual([1, 2, "bar"]);
    expect(qml.hexProperty).toEqual(255);
    expect(qml.octProperty).toEqual(63);
    expect(qml.bigNumber).toEqual(100000000);
    expect(qml.sizeProperty.width).toEqual(5);
    expect(qml.sizeProperty.height).toEqual(6);
  });

  it("undefined property has undefined value", function() {
    var qml = load("Undefined", this.div);
    expect(qml.theUndefined).toEqual(undefined);
    expect(typeof qml.theUndefined).toEqual("undefined");
  });

  it("can be aliased", function() {
    var qml = load("Alias", this.div);
    expect(qml.childX).toBe(125);
  });

  it("alias have changed signal", function() {
    var qml = load("AliasChanged", this.div);
    qml.go();
    expect(qml.childX).toBe(44);
    expect(qml.log).toBe("childX changed to 44!");
    qml.go(); // second call should not call changed signal again
    expect(qml.log).toBe("childX changed to 44!");
  });

  it("alias propagates it's changed signal back to referenced property",
    function() {
      var qml = load("AliasChangedBack", this.div);
      qml.go();
      expect(qml.thechild.x).toBe(100);
    }
  );

  it("alias to id", function() {
    var qml = load("AliasToId", this.div);
    expect(qml.childA.x).toBe(125);
  });

  it("alias to id with same name", function() {
    var qml = load("AliasToIdSameName", this.div);
    expect(qml.child.x).toBe(125);
  });


  it("can be named signal", function() {
    load("NamedSignal", this.div);
  });

  it("works when named signal", function() {
    var qml = load("NamedSignalValues", this.div);
    expect(qml.signal).toBe(20);
  });

  /* in Qml, when assigning non-string value to string property,
     is convert's new value to string. */
  it("StringConversion", function() {
    var qml = load("StringConversion", this.div);

    expect(qml.stringA).toBe("10");
    expect(typeof qml.stringA).toBe("string");
    expect(qml.stringB).toBe("11");
    expect(typeof qml.stringB).toBe("string");
    expect(qml.stringBinding).toBe("2");
    expect(typeof qml.stringBinding).toBe("string");
    expect(qml.stringFalseVal).toBe("0");
    expect(typeof qml.stringFalseVal).toBe("string");
    qml.reassign();
    expect(qml.stringA).toBe("333");
    expect(typeof qml.stringA).toBe("string");
  });

  it("ChangedSignal", function() {
    var qml = load("ChangedSignal", this.div);
    expect(qml.result).toBe(69);
  });

  it("ChangedExpressionSignal", function() {
    var qml = load("ChangedExpressionSignal", this.div);
    expect(qml.counter).toBe(1);
  });

  it("Url", function() {
    var qml = load("Url", this.div);
    expect(qml.localBindingSimple).toBe(
      QmlWeb.engine.$basePath + "PropertiesUrlDir/localBindingSimple.png");
    expect(qml.localBinding).toBe(
      QmlWeb.engine.$basePath + "PropertiesUrlDir/localBinding.png");
    expect(qml.localSet).toBe(
      QmlWeb.engine.$basePath + "PropertiesUrlDir/localSet.png");
    expect(qml.remoteBindingSimple).toBe(
      QmlWeb.engine.$basePath + "remoteBindingSimple.png");
    expect(qml.remoteBinding).toBe(
      QmlWeb.engine.$basePath + "remoteBinding.png");
    expect(qml.remoteSet).toBe(QmlWeb.engine.$basePath + "remoteSet.png");
    expect(qml.http).toBe("http://http-url");
    expect(qml.aboutBlank).toBe("about:blank");
    /* Get the base address of the URL */
    const a = document.createElement("a");
    a.href = "/";
    expect(qml.absolute).toBe(a.href + "absolute-url");
    expect(qml.unset).toBe("");
    expect(qml.setToEmptyString).toBe("");
  });

  it("Url exception safe", function() {
    var qml = load("UrlExceptionSafe", this.div);
    expect(qml.localBindingSimple).toBe(
      QmlWeb.engine.$basePath + "PropertiesUrlDir/localBindingSimple.png");
    expect(qml.localBinding).toBe(
      QmlWeb.engine.$basePath + "PropertiesUrlDir/localBinding.png");
    expect(qml.localSet).toBe(
      QmlWeb.engine.$basePath + "PropertiesUrlDir/localSet.png");
    expect(qml.remoteBindingSimple).toBe(
      QmlWeb.engine.$basePath + "remoteBindingSimple.png");
    expect(qml.remoteBinding).toBe(
      QmlWeb.engine.$basePath + "remoteBinding.png");
    expect(qml.remoteSet).toBe(QmlWeb.engine.$basePath + "remoteSet.png");
  });

  xit("supports default properties", function() {
    var qml = load("Default", this.div);
    expect(qml.text).toBe("Hello, world!");
  });
});
