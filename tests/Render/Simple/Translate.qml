import QtQuick 2.0

Item {
  width: 30; height: 24
  Rectangle {
    width: 10; height: 10
    color: '#0f0'
    transform: Translate { x: 2; y: 5 }
  }
  Rectangle {
    width: 10; height: 10
    anchors.bottom: parent.bottom
    anchors.right: parent.right
    color: '#00f'
    transform: Translate { x: -2; y : -5 }
  }
}
