import QtQuick 2.0

Item {
  property alias repeater: _repeater
  Repeater {
    id: _repeater
    model: ListModel {
      ListElement {
        role1: "foo"
        role2: 42
      }
      ListElement {
        role1: "bar"
        role2: 43
      }
    }
    Item {
      id: outer_item
      property var firstRole: model.role1
      property var secondRole: model.role2
      property alias firstRoleInner: inner_item.firstRole
      property alias secondRoleInner: inner_item.secondRole
      property string role1: "blah"
      Component.onCompleted: {
        console.log(outer_item.role1, role1, model.role1)
      }
      Item {
        id: inner_item
        property var firstRole: model.role1
        property var secondRole: model.role2
      }
    }
  }
}
