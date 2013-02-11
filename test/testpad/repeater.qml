import QtQuick 1.0

Rectangle {
    id: page
    width: 500; height: 500
    color: "lightgray"

    MouseArea {
        anchors.fill: parent

        onClicked: if (Math.random() < 0.5) {
            tModel.append({ label: "Hallo!" });
        } else {
            tModel.remove(Math.floor(rep.count * Math.random()));
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

        TestComponent {
            x: 5 + (width + 10) * (index %2)
            y: 5 + 100 * Math.floor(index /2)
            width: page.width / 2 - 10
            height: 90

            Text {
                anchors.centerIn: parent
                text: label + " (Element " + index + "/" + rep.count + ")"

                Component.onCompleted: console.log("Added an element");
            }
        }
    }
}
 
