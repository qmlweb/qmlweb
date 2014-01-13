import QtQuick 1.0

Rectangle {
    id: page
    width: 500; height: 500
    color: "lightgray"

    Rectangle {
        anchors.right: parent.horizontalCenter
        anchors.bottom: parent.bottom
        width: 100
        height: 30
        color: "lightgreen"
        border.color: "grey"
        border.width: 1

        Text {
            anchors.centerIn: parent
            text: "Add"
        }

        MouseArea {
            anchors.fill: parent

            onClicked: tModel.append({ label: "Hullo!" });
        }
    }
    Rectangle {
        anchors.left: parent.horizontalCenter
        anchors.bottom: parent.bottom
        width: 100
        height: 30
        color: "lightgreen"
        border.color: "grey"
        border.width: 1

        Text {
            anchors.centerIn: parent
            text: "Remove"
        }

        MouseArea {
            anchors.fill: parent

            onClicked: tModel.remove(Math.floor(rep.count * Math.random()));
        }
    }

    ListModel {
        id: tModel
        ListElement {
            label: "Hello World!"
        }
        ListElement {
            label: "Heyo World!"
        }
        ListElement {
            label: "Morning, World!"
        }
        ListElement {
            label: "Hi, folks!"
        }
        ListElement {
            label: "G'day, World!"
        }
    }

    Repeater {
        id: rep
        model: tModel

        delegate: Rectangle {
            id: item
            x: 5 + (width + 10) * (index %2)
            y: 5 + 100 * Math.floor(index /2)
            width: page.width / 2 - 10
            height: 90
            border.color: "darkgrey"
            color: "orange"

            Text {
                anchors.centerIn: parent
                text: label + " (Element " + index + "/" + rep.count + ")"

                Component.onCompleted: console.log("Added an element (index: " + item.index + ")");
            }
        }
    }
}
 
