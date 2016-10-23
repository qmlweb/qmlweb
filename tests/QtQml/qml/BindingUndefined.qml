import QtQuick 2.5

Item {
  property var targetValue: null
  property alias sourceValue: sourceItem.value
  property bool when: true

  id: root

  Item {
    property var value: null
    id: sourceItem
  }

  Binding {
    target: root; property: "targetValue"; when: root.when; value: sourceItem.value
  }
}
