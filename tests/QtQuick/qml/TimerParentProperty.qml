import QtQuick 2.0

Item {
  property int value: 42

  property alias timer: _timer
  Timer {
    id: _timer
    property int value: parent.value
  }
}
