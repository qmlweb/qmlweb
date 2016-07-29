describe("Initialize.loadQml", function() {
  setupDivElement();

  it("it can load qml without a file", function() {
    loadQml("import QtQuick 2.0\nItem {}\n", this.div);
  });
});

var modules = {
  "QtQuick 2.5": {
    AnimatedImage: { dom: true },
    Animation: {},
    Behavior: {},
    BorderImage: {},
    Canvas: { dom: true },
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
    TextEdit: { dom: true },
    TextInput: { dom: true },
    Timer: {},
    Transition: {},
    Translate: {}
  },
  "QtQuick.Controls 1.4": {
    Button: { dom: true },
    CheckBox: { dom: true },
    ComboBox: { dom: true },
    ScrollView: { dom: true },
    TextArea: { dom: true },
    TextField: { dom: true }
  },
  "QtGraphicalEffects 1.0": {
    FastBlur: { dom: true }
  },
  "QtMobility 1.2": {
  },
  "QtMultimedia 5.6": {
    Video: { dom: true }
  },
  "QtWebSockets 1.0": {
    WebSocket: {}
  },
  "Qt.labs.settings 1.0": {
    Settings: {}
  },
  "QmlWeb 1.0": {
    RestModel: {}
  },
  "QmlWeb.Dom 1.0": {
    DomElement: { dom: true }
  }
};

function testModule(module, element, imports, options) {
  describe("Initialize." + module, function() {
    setupDivElement();

    it(element, function() {
      var src = imports + element + " { }\n";
      var qml = loadQml(src, this.div);
      if (options.dom) {
        expect(this.div.className).toBe(element);
        expect(this.div.style.boxSizing).toBe("border-box");
      }
      expect(qml.Component).not.toBe(undefined);
    });
  });
}

Object.keys(modules).forEach(function(key) {
  var module = modules[key];
  if (module._version) {
    module._name = key;
  } else {
    var split = key.split(" ");
    module._name = split[0];
    module._version = split[1];
  }
  var imports = "import " + module._name + " " + module._version + "\n";
  for (var i in module._depends || []) {
    imports += "import " + module._depends[i] + "\n";
  }
  Object.keys(module).forEach(function(element) {
    if (element[0] === "_") return;
    testModule(module._name, element, imports, module[element]);
  });
});
