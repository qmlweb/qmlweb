//var log4js = require('log4js');

describe('Initialize.loadQml', function () {
  it('it can load qml without a file', function () {
    var div = loadQml("import QtQuick 2.0\nItem {}\n");
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
    Column: {dom: true},
    DoubleValidator: {},
    Flow: {},
    Font: {},
    FontLoader: {},
    Grid: {dom: true},
    Image: {dom: true},
    IntValidator: {},
    ListElement: {},
    ListModel: {},
    ListView: {dom: true},
    Loader: {},
    MouseArea: {dom: true},
    NumberAnimation: {},
    ParallelAnimation: {},
    PropertyAnimation: {},
    Rectangle: {dom: true},
    RegExpValidator: {},
    Repeater: {dom: true},
    Rotation: {},
    Row: {dom: true},
    Scale: {},
    SequentialAnimation: {},
    State: {},
    SystemPalette: {},
    Text: {dom: true},
    TextInput: {dom: true},
    Timer: {},
    Transition: {},
    Translate: {},
  }
}

function testModule(modules, testFunc) {
  Object.keys(modules).forEach(function (module) {

    var imports = "import " + module + " " + modules[module]._version + "\n"
    for(var i in module._depends){
      imports += "import " + module._depends[i] + "\n"
    }
    Object.keys(modules[module]).forEach(function (type) {
      if(type[0] === ("_")) return;
      testFunc(module, type, imports, modules[module][type])
    })
  })
}

testModule(modules, function (module, type, imports, options) {
  describe('Initialize.' + module + "-" + type, function () {
    it('can be loaded', function () {
      var src = imports +type + " { }\n"
      var engine = loadQml(src);
      var div = engine.rootElement
      var qml = engine.rootObject
      expect(div).not.toBe(undefined)
      if (options.dom) {
        expect(div.className).toBe(type)
        expect(div.qml).not.toBe(undefined)
        expect(div.qml.Component).not.toBe(undefined)
      }
      else
        expect(qml.Component).not.toBe(undefined)
    });
  });
})


