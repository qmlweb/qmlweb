import QtQuick 2.0

Flow {
  width: 23
  height: 17
  Repeater {
    model: 11
    delegate: Rectangle {
      color: index % 3 ? '#ccc' : '#000'
      width: 5
      height: 5
    }
  }
}
