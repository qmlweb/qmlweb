import QtQuick 2.0

Rectangle {
  color: "white"
  width: 16
  height: 16
  Rectangle {
    id: red
    color: "red"
    anchors.fill: parent
    Rectangle {
      color: "blue"
      anchors.fill: parent
      anchors.margins: 3
    }
  }
}
