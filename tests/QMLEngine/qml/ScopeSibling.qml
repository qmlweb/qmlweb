import QtQuick 2.5

Item {
  ItemWithValue {
    id: childA
    value: 2
  }

  ItemWithValue {
    id: childB
    value: childA.value * 2
  }
}
