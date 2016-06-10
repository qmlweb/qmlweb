import QtQuick 2.0

Rectangle {
  color: "green"
  width: 40; height: 30

  Item {
    anchors {
      left: parent.left
      /* Anchor to another item */
      right: anchor_right_item.left
    }

    Item {
      anchors{
        /* Anchor this item to parent.horizontalCenter */
        horizontalCenter: parent.horizontalCenter
      }

      /* Have a Column */
      Column {
        width: 10

        Item {
          /* Anchor to parent left and right */
          anchors.left: parent.left
          anchors.right: parent.right
          /* Set height to width */
          height: width
          Rectangle {
            /* Use this format, instead of the equivalent "anchors.fill" */
            anchors.centerIn: parent
            width: parent.width
            height: parent.height
            color: "blue"
          }
        }

        /* Have a second copy of the same item */
        Item {
          anchors.left: parent.left
          anchors.right: parent.right
          height: width
          Rectangle {
            anchors.centerIn: parent
            width: parent.width
            height: parent.height
            color: "red"
          }
        }
      }
    }
  }

  Rectangle {
    id: anchor_right_item
    anchors {
        right: parent.right
    }
    color: "yellow"
    height: 10
    width: 10
  }
}
