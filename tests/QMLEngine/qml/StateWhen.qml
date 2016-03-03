import QtQuick 2.0
Item {
  id: root
  property int value: 10
  property int stateTrigger: 0

  states: [
    State {
      name: "state1"
      PropertyChanges {
        target: root
        value: 20
      }
      when: root.stateTrigger == 1
    },
    State {
      name: "state2"
      PropertyChanges {
        target: root
        value: 30
      }
      when: root.stateTrigger == 2
    }
  ]

  function start(){
    yield()
    stateTrigger = 1
    yield()
    stateTrigger = 2
    yield()
    stateTrigger = 3
    yield()
  }
}
