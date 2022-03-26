import QtQuick 2.0
import QtQuick.Layouts 1.0

GridLayout {
  flow: GridLayout.TopToBottom
  layoutDirection: Qt.LeftToRight
  rows: 3

  Repeater {
    model: 11
    delegate: Rectangle {
      implicitWidth: 100
      implicitHeight: 100
      color: ["red", "green", "blue"][index % 3]
    }
  }
}
