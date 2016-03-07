import QtQuick 2.0

Rectangle {
  color: "white"
  width: 16
  height: 16

  Rectangle {
    id: bl
    color: "orange"
    width: 8
    height: 8
    anchors {
      left: parent.left
      bottom: parent.bottom
    }
  }
  Rectangle {
    id: tl
    color: "green"
    anchors {
      left: parent.left
      top: parent.top
      bottom: bl.top
      right: tr.left
    }
  }
  Rectangle {
    id: tr
    color: "cyan"
    width: 6
    anchors {
      right: parent.right
      top: parent.top
      bottom: br.top
      bottomMargin: 2
    }
  }
  Rectangle {
    id: br
    color: "red"
    height: 6
    anchors {
      right: parent.right
      bottom: parent.bottom
      left: bl.right
      margins: 2
    }
  }
}
