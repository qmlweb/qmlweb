describe("QMLEngine.importPath", function() {
  setupDivElement();

  it("importPathList default", function() {
    var engine = new QmlWeb.QMLEngine(this.div);
    var paths = engine.importPathList();
    expect(Array.isArray(paths)).toBe(true);
    expect(paths.length).toBe(0);
  });

  it("addImportPath", function() {
    var engine = new QmlWeb.QMLEngine(this.div);

    engine.addImportPath("http://example.org/path/to/qml");
    expect(engine.importPathList().length).toBe(1);
    expect(typeof engine.importPathList()[0]).toBe("string");
    expect(engine.importPathList()[0]).toBe("http://example.org/path/to/qml");

    engine.addImportPath("http://example.org/second/path");
    expect(engine.importPathList().length).toBe(2);
    expect(engine.importPathList()[0]).toBe("http://example.org/path/to/qml");
    expect(engine.importPathList()[1]).toBe("http://example.org/second/path");
  });

  it("setImportPathList", function() {
    var engine = new QmlWeb.QMLEngine(this.div);

    engine.addImportPath("http://example.org/path/to/qml");
    engine.addImportPath("http://example.org/second/path");

    engine.setImportPathList([]);
    expect(engine.importPathList().length).toBe(0);

    engine.addImportPath("http://example.org/path/to/qml");
    expect(engine.importPathList().length).toBe(1);

    engine.setImportPathList(["http://example.org/path3"]);
    expect(engine.importPathList().length).toBe(1);
    expect(engine.importPathList()[0]).toBe("http://example.org/path3");

    engine.setImportPathList(["http://example.org/4", "http://example.org/5"]);
    expect(engine.importPathList().length).toBe(2);
    expect(engine.importPathList()[0]).toBe("http://example.org/4");
    expect(engine.importPathList()[1]).toBe("http://example.org/5");
  });
});
