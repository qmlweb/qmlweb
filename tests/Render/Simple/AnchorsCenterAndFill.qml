import QtQuick 2.0

Rectangle {
  color: "white"
  width: 16
  height: 16
  Rectangle {
    id: red
    color: "red"
    anchors.centerIn: parent
    width: 8
    height: 8
    Rectangle {
      color: "blue"
      anchors.horizontalCenter: parent.horizontalCenter
      anchors.top: parent.top
      anchors.bottom: parent.bottom
      width: 4
    }
  }
  Rectangle {
    anchors.verticalCenter: parent.verticalCenter
    width: parent.width
    height: 4
    color: "grey"
  }
}
