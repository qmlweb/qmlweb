import QtQuick 2.0
import QtQuick.Controls 1.1

Item {
  id: it

  property alias child: child

  Item {
    id: child
    x: 125
  }

  Text {
    text: it.child.x
  }
}
