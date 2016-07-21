import QtQuick 2.0

Rectangle {
  width: 20
  height: 20

  Flow {
    flow: Flow.TopToBottom
    height: 18
    Repeater {
      model: 7
      delegate: Rectangle {
        color: index % 2 ? '#ccc' : '#000'
        width: 5
        height: 5
      }
    }
    Component.onCompleted: {
      height = 20
    }
  }
}
