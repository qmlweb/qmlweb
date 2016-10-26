import QtQuick 2.0

Item {
  property alias repeater: _repeater
  Repeater {
    id: _repeater
    model: ListModel {
      ListElement {
        roleName: "foo"
      }
    }
    Item {
      property var roleName: "bar"
      property var implicitRoleNameReference: roleName
      property var explicitRoleNameReference: model.roleName
    }
  }
}
