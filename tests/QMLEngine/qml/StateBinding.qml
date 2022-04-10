import QtQuick 2.0
Item {
  id: root
  property int stateTrigger: 0
  property int variable: 5
  property int value: 10 + variable

  states: [
    State {
      name: "state1"
      PropertyChanges {
        target: root
        value: 20 + variable
      }
      when: root.stateTrigger == 1
    },
    State {
      name: "state2"
      PropertyChanges {
        target: root
        value: 30 + variable
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
