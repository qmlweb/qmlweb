describe('Initialize.loadQml', function() {
  setupDivElement();

  it('it can load qml without a file', function() {
    loadQml("import QtQuick 2.0\nItem {}\n", this.div);
  });
});

var modules = {
  "QtQuick": {
    _version: "2.5",
    _depends: {},
    AnimatedImage: {},
    Animation: {},
    Behavior: {},
    BorderImage: {},
    Column: { dom: true },
    DoubleValidator: {},
    Flow: {},
    Font: {},
    FontLoader: {},
    Grid: { dom: true },
    Image: { dom: true },
    IntValidator: {},
    ListElement: {},
    ListModel: {},
    ListView: { dom: true },
    Loader: {},
    MouseArea: { dom: true },
    NumberAnimation: {},
    ParallelAnimation: {},
    PropertyAnimation: {},
    Rectangle: { dom: true },
    RegExpValidator: {},
    Repeater: { dom: true },
    Rotation: {},
    Row: { dom: true },
    Scale: {},
    SequentialAnimation: {},
    State: {},
    SystemPalette: {},
    Text: { dom: true },
    TextInput: { dom: true },
    Timer: {},
    Transition: {},
    Translate: {}
  }
};

function testModule(modules, testFunc) {
  Object.keys(modules).forEach(function(module) {
    var imports = "import " + module + " " + modules[module]._version + "\n";
    for (var i in module._depends) {
      imports += "import " + module._depends[i] + "\n";
    }
    Object.keys(modules[module]).forEach(function(element) {
      if (element[0] === "_") return;
      testFunc(module, element, imports, modules[module][element]);
    });
  });
}

testModule(modules, function(module, element, imports, options) {
  describe('Initialize.' + module, function() {
    setupDivElement();

    it(element, function() {
      var src = imports + element + " { }\n";
      var qml = loadQml(src, this.div);
      if (options.dom) {
        expect(this.div.className).toBe(element);
        expect(this.div.qml).not.toBe(undefined);
        expect(this.div.qml).toBe(qml);
      }
      expect(qml.Component).not.toBe(undefined);
    });
  });
});
