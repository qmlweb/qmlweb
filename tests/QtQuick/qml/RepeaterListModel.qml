import QtQuick 2.0

Item {
  property alias repeater: _repeater
  Repeater {
    id: _repeater
    model: ListModel {
      id: list_model
    }
    Item {
      property var firstRole: role1
      property var secondRole: role2
    }
  }
}
