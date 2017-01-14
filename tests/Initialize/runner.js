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
    Animator: {},
    Behavior: {},
    BorderImage: {},
    Canvas: { dom: true },
    Column: { dom: true },
    DoubleValidator: {},
    Flow: {},
    FocusScope: { dom: true },
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
    ColorAnimation: {},
    NumberAnimation: {},
    OpacityAnimator: {},
    ParallelAnimation: {},
    PauseAnimation: {},
    PropertyAnimation: {},
    Rectangle: { dom: true },
    RegExpValidator: {},
    Repeater: { dom: true },
    Rotation: {},
    RotationAnimator: {},
    Row: { dom: true },
    Scale: {},
    ScaleAnimator: {},
    SequentialAnimation: {},
    ShaderEffect: { dom: true },
    ShaderEffectSource: { dom: true },
    State: {},
    SystemPalette: {},
    Text: { dom: true },
    TextEdit: { dom: true },
    TextInput: { dom: true },
    Timer: {},
    Transition: {},
    Translate: {},
    UniformAnimator: {},
    XAnimator: {},
    YAnimator: {}
  },
  "QtQml.Models 2.2": {
    ListElement: {},
    ListModel: {}
  },
  "QtQuick.Controls 1.4": {
    ApplicationWindow: { dom: true },
    Button: { dom: true },
    CheckBox: { dom: true },
    ComboBox: { dom: true },
    ScrollView: { dom: true },
    TextArea: { dom: true },
    TextField: { dom: true }
  },
  "QtQuick.Controls 2": {
    AbstractButton: { dom: true },
    ApplicationWindow: { dom: true },
    Container: { dom: true },
    Control: { dom: true },
    Label: { dom: true },
    Page: { dom: true },
    SwipeView: { dom: true },
    TabBar: { dom: true },
    TabButton: { dom: true }
  },
  "QtQuick.Layouts 1.3": {
    ColumnLayout: { dom: true },
    GridLayout: { dom: true },
    Layout: { fail: /Do not create objects of type Layout/ },
    RowLayout: { dom: true },
    StackLayout: { dom: true }
  },
  "QtQuick.Window 2.2": {
    Screen: { fail: /Screen can only be used via the attached property/ },
    Window: { dom: true }
  },
  "QtQuick.Particles 2.0": {
    AngleDirection: {},
    CustomParticle: { dom: true },
    Direction: {},
    Emitter: { dom: true },
    ParticlePainter: { dom: true },
    ParticleSystem: { dom: true }
  },
  "QtGraphicalEffects 1.0": {
    FastBlur: { dom: true },
    RectangularGlow: { dom: true }
  },
  "QtMobility 1.2": {
  },
  "QtMultimedia 5.0": {
    // X.0 imports should work
    Video: { dom: true }
  },
  "QtMultimedia 5.6": {
    Audio: {},
    Camera: {},
    MediaPlayer: {},
    VideoOutput: { dom: true },
    Video: { dom: true }
  },
  "QtNfc 5.2": {
    NearField: {}
  },
  "QtTest 1.1": {
    SignalSpy: { dom: true },
    TestCase: { dom: true }
  },
  "QtWebEngine 5.7": {
    WebEngineView: { dom: true }
  },
  "QtWebView 1.1": {
    WebView: { dom: true }
  },
  "QtWebKit 3.0": {
    WebView: { dom: true }
  },
  "QtBluetooth 5.2": {
    BluetoothDiscoveryModel: {}
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
    DomDiv: { dom: true },
    DomParagraph: { dom: true },
    DomElement: { dom: true }
  }
};

function testModule(module, element, imports, options) {
  describe("Initialize." + module, function() {
    setupDivElement();

    it(element, function() {
      var src = imports + element + " { }\n";
      if (options.fail) {
        var f = function() {
          loadQml(src, this.div);
        };
        expect(f.bind(this)).toThrowError(options.fail);
        return;
      }
      var qml = loadQml(src, this.div);
      if (options.dom) {
        var div = this.div.children[0];
        expect(div.className).toBe(element);
        expect(div.style.boxSizing).toBe("border-box");
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
