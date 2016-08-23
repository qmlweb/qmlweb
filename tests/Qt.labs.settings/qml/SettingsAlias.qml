import QtQuick 2.0
import Qt.labs.settings 1.0

Item {
  id: root
  Settings {
    category: "QmlWebTestAlias"
    property alias width: root.width
    property alias height: root.height
  }
}
