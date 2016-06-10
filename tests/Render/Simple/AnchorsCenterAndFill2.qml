import QtQuick 2.0

Rectangle {
  color: "green"
  width: 30; height: 30

  Rectangle {
    anchors.centerIn: parent
    color: "blue"
    width: 10
    height: 10

    Item {
      anchors.fill: parent
      anchors.margins: 2

      Rectangle {
        anchors.centerIn: parent
        width: 8
        height: 8
        color: "red"
      }
    }
  }
}
