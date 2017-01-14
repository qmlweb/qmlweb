import QtQuick 2.0

Item {
  width: 10
  height: 10
  Rectangle {
      width: 10
      height: 10
      color: 'black'

      ColorAnimation on color {
        from: 'red'; to: 'green'; duration: 50
        running: true
      }
  }

  Timer {
    interval: 100
    running: typeof window !== 'undefined'
    onTriggered: window.onTestLoad()
  }
}
