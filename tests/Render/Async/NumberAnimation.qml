import QtQuick 2.0

Item {
    width: 20
    height: 10

    Rectangle {
        color: "blue"
        width: 10
        height: 10

        NumberAnimation on x {
          from: 0; to: 10; duration: 50
          running: true
        }

        Component.onCompleted: color = x > 0 ? 'red' : 'green'
    }

    Timer {
      interval: 100
      running: typeof window !== 'undefined'
      onTriggered: window.onTestLoad()
    }
}
