import QtQuick 2.0
import QtQuick.Controls 1.1

Item {
  property alias childA: child

  Item {
    id: child
    x: 125
  }

  Text {
    text: childA.x
  }
}
