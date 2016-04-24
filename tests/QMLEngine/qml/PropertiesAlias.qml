import QtQuick 2.0

Item {
  property alias childX: child.x

  Item {
    id: child
    x: 125
  }
}
