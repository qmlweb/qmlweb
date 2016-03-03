import QtQuick 2.0

Rectangle {
  color: '#fff'
  width: 50
  height: 25

  Repeater {
    model: 10
    delegate: Rectangle {
      color: 'black'
      width: 5
      height: 5
      x: 5 * index
      y: 5 * index % parent.height
    }
  }
}
