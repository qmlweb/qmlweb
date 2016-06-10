import QtQuick 2.5
Item {
  id: root

  function start() {
    success_timer.running = true
    fail_timer.start()
  }

  Timer {
    id: fail_timer
    interval: 500
    onTriggered: {
      root.yield(false)
    }
  }

  Timer {
    id: success_timer
    interval: 250
    onTriggered: {
      fail_timer.stop()
      root.yield(true)
    }
  }
}
