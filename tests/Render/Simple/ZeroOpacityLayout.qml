import QtQuick 2.0

Row {
  width: 30
  height: 20
  Rectangle {
    width: 10
    height: parent.height
    color: 'red'
    opacity: 0
  }
  Rectangle {
    width: 10
    height: parent.height
    color: 'black'
  }
  Column {
    height: parent.height
    width: 10
    Rectangle {
      height: 10
      width: parent.width
      color: 'red'
      opacity: 0
    }
    Rectangle {
      height: 10
      width: parent.width
      color: 'black'
    }
  }
}
