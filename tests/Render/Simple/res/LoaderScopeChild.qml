import QtQuick 2.0

Item {
  Rectangle {
    anchors.top: parent.top
    anchors.right: parent.right
    width: 15
    height: 15
    color: 'green'
  }
  Rectangle {
    anchors.left: parent.left
    anchors.bottom: parent.bottom
    width: root.width / 2
    height: root.height / 2
    color: 'blue'
  }
}
