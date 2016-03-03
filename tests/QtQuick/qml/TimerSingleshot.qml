import QtQuick 2.5
Timer {
  interval: 50
  property int counter: 0
  onTriggered: {
    yield("done")
  }
}
