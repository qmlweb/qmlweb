import QtQuick 2.0
import "importTestSimple.js" as Imported

Item {
  property alias component: _component
  property alias component2: _component2
  property alias loader: _loader
  property alias repeater: _repeater

  function importedColor() {
    return Imported.importedColor;
  }
  function setImportedColor(color) {
    return Imported.importedColor = color;
  }

  ImportJavascript {
      id: _component
  }
  ImportJavascript {
      id: _component2
  }

  Repeater {
      id: _repeater
      model: 2
      ImportJavascript {
      }
  }

  Loader {
      id: _loader
      source: "ImportJavascript.qml"
  }
}
