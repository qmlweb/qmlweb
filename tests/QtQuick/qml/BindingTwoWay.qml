import QtQuick 2.5

Item {
  property alias targetValue: targetItem.value
  property alias sourceValue: sourceItem.value
  property bool when: true

  id: root

  Item {
    property int value: 0
    id: sourceItem
  }

  Item {
    property int value: 0
    id: targetItem
  }

  Binding {
    target: targetItem; property: "value"; value: sourceItem.value; when: root.when
  }

  Binding {
    target: sourceItem; property: "value"; value: targetItem.value; when: root.when
  }
}
