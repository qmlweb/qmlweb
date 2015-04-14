import QtQuick 1.0

Rectangle {
    id: page
    width: 500; height: 500
    color: "lightgray"

    Column {
      width: 200
      x: 5
      spacing: 3

    Repeater {
        id: rep
        model: 5

        Rectangle {
            id: item
            width: 100
            height: 20
            border.color: "darkgrey"
            color: "orange"

            Text {
                anchors.centerIn: parent
                text: " (Element " + index + "/" + rep.count + ")"
            }
        }
    }

    }
}
 
 