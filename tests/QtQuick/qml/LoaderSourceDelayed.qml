import QtQuick 2.0

Loader {
  id: loader

  function start() {
    timer.start()
  }

  Timer {
    id: timer
    interval: 10
    onTriggered: {
      loader.source = "LoaderComponent.qml"
      loader.yield()
    }
  }
}
