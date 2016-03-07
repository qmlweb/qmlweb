import QtQuick 2.0

Rectangle {
  color: "white"
  width: 16
  height: 16

  Rectangle {
    color: "orange"
    width: 8
    height: 8
    anchors {
      left: parent.left
      bottom: parent.bottom
    }
  }
  Rectangle {
    color: "green"
    width: 6
    height: 6
    anchors {
      left: parent.left
      top: parent.top
    }
  }
  Rectangle {
    color: "cyan"
    width: 8
    height: 8
    anchors {
      right: parent.right
      top: parent.top
    }
  }
  Rectangle {
    color: "red"
    width: 6
    height: 6
    anchors {
      right: parent.right
      bottom: parent.bottom
    }
  }
}
