import QtQuick 2.0
Item {
  id: root
  property int value: 10
  states: [
    State {
      name: "otherState"
      PropertyChanges {
        target: root
        value: 20
      }
    }
  ]
  function start() {
    yield()
    state = "otherState"
    yield()
    state = ""
    yield()
  }
}
