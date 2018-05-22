describe("QMLEngine.imports", function() {
  setupDivElement();
  var load = prefixedQmlLoader("QMLEngine/qml/Import");

  it("Javascript", function() {
    load("Javascript", this.div);
    var div = this.div.children[0];
    expect(div.offsetWidth).toBe(20);
    expect(div.offsetHeight).toBe(10);
    expect(div.children[0].style.backgroundColor).toBe("rgb(255, 0, 255)");
  });
  it("Javascript Qt.include", function() {
    var qml = load("JavascriptInclude", this.div);
    expect(qml.value).toBe(42);
  });
  it("Javascript scope", function() {
    var qml = load("JavascriptScope", this.div);

    expect(qml.importedColor()).toBe("magenta");
    expect(qml.component.importedColor()).toBe("magenta");
    expect(qml.component2.importedColor()).toBe("magenta");
    expect(qml.repeater.itemAt(0).importedColor()).toBe("magenta");
    expect(qml.repeater.itemAt(1).importedColor()).toBe("magenta");
    expect(qml.loader.item.importedColor()).toBe("magenta");

    qml.setImportedColor("black");
    expect(qml.importedColor()).toBe("black");
    expect(qml.component.importedColor()).toBe("magenta");
    expect(qml.component2.importedColor()).toBe("magenta");
    expect(qml.repeater.itemAt(0).importedColor()).toBe("magenta");
    expect(qml.repeater.itemAt(1).importedColor()).toBe("magenta");
    expect(qml.loader.item.importedColor()).toBe("magenta");

    qml.component.setImportedColor("white");
    expect(qml.importedColor()).toBe("black");
    expect(qml.component.importedColor()).toBe("white");
    expect(qml.component2.importedColor()).toBe("magenta");
    expect(qml.repeater.itemAt(0).importedColor()).toBe("magenta");
    expect(qml.repeater.itemAt(1).importedColor()).toBe("magenta");
    expect(qml.loader.item.importedColor()).toBe("magenta");

    qml.repeater.itemAt(0).setImportedColor("red");
    expect(qml.importedColor()).toBe("black");
    expect(qml.component.importedColor()).toBe("white");
    expect(qml.component2.importedColor()).toBe("magenta");
    expect(qml.repeater.itemAt(0).importedColor()).toBe("red");
    expect(qml.repeater.itemAt(1).importedColor()).toBe("magenta");
    expect(qml.loader.item.importedColor()).toBe("magenta");

    qml.loader.item.setImportedColor("green");
    expect(qml.importedColor()).toBe("black");
    expect(qml.component.importedColor()).toBe("white");
    expect(qml.component2.importedColor()).toBe("magenta");
    expect(qml.repeater.itemAt(0).importedColor()).toBe("red");
    expect(qml.repeater.itemAt(1).importedColor()).toBe("magenta");
    expect(qml.loader.item.importedColor()).toBe("green");
  });
  it("Qmldir", function() {
    load("Qmldir", this.div);
    var div = this.div.children[0];
    expect(div.offsetWidth).toBe(50);
    expect(div.offsetHeight).toBe(100);
    expect(div.children[0].style.backgroundColor).toBe("rgb(0, 128, 0)");
    // #0ff and cyan doesn't work, because PhantomJS converts
    // them to rgb( 0,255,255 ).. how to compare colors?..
  });
  it("Qmldir singleton", function() {
    load("QmldirSingleton", this.div);
    var div = this.div.children[0];
    expect(div.offsetWidth).toBe(20);
    expect(div.offsetHeight).toBe(10);
    expect(div.children[0].style.backgroundColor).toBe("rgb(0, 128, 0)");
  });
  it("can import from sibling directory", function() {
    var qml = load("From/SiblingDir", this.div);
    expect(qml.text).toBe("I'm simple");
  });
  it("can import from parent directory", function() {
    var qml = load("From/ParentDir", this.div);
    expect(qml.value).toBe(5);
  });
  it("can import from directory without qmldir file", function() {
    var qml = load("NoQmldir", this.div);
    expect(qml.value).toBe(67);
  });
  it("module imports are local to file, should succeed", function() {
    var f = function() {
      load("LocalToFile/ModuleSucceed", this.div);
    };
    expect(f.bind(this)).not.toThrow();
  });
  it("module imports are local to file, should fail 1", function() {
    var f = function() {
      load("LocalToFile/ModuleFail1", this.div);
    };
    expect(f.bind(this)).toThrowError("No constructor found for WebSocket");
  });
  it("module imports are local to file, should fail 2", function() {
    var f = function() {
      load("LocalToFile/ModuleFail2", this.div);
    };
    expect(f.bind(this)).toThrowError("No constructor found for WebSocket");
  });
  it("directory imports are local to file, should fail", function() {
    var f = function() {
      load("LocalToFile/DirectoryFail", this.div);
    };
    expect(f.bind(this)).toThrowError("No constructor found for ImportMe");
  });
  it("can find local Component assigned to property when in another directory",
    function() {
      var qml = load("LocalComponentAsPropertyInAnotherDir", this.div);
      expect(qml.value).toBe(67);
    }
  );
  it("qualified imports from module", function() {
    var qml = load("QualifiedModule", this.div);
    expect(qml.value).toBe(67);
  });
  it("qualified from directory without qmldir file", function() {
    var qml = load("QualifiedNoQmldir", this.div);
    expect(qml.value).toBe(67);
  });
  it("reuse cached import from another directory", function() {
    var f = function() {
      load("Reuse/main", this.div);
    };
    expect(f.bind(this)).not.toThrow();
  });
});
