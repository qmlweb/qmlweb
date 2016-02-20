import QtQuick 2.0

Rectangle {
  color: '#ff9'
  width: 25
  height: 25

  ListModel {
    id: list
    ListElement { my: 'blue' }
    ListElement { my: 'red' }
    ListElement { my: 'transparent' }
    ListElement { my: '#0f0' }
    ListElement { my: '#0ff' }
  }

  Repeater {
    model: list
    Rectangle {
      color: my
      width: 5
      height: 5
      x: 5 * index
      y: 5 * index
    }
  }
  Repeater {
    model: list
    delegate: Rectangle {
      color: my
      width: 5
      height: 5
      x: 5 * index
      y: 20 - 5 * index
    }
  }
}
