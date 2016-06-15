import QtQuick 2.0

Item {
  id: root
  property int value: 0

  property int test_value: 0

  property alias new_target: _new_target
  Item {
    id: _new_target
    property int value: 0
  }

  property alias connections: _connections
  Connections {
    id: _connections
    onValueChanged: {
      root.test_value++
    }
  }
}
