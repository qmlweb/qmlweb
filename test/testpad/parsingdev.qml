// Importing was not supported while writing this example
import Qt 4.7
Rectangle {
    id: main
    property int value: 5
    width: 600; height: 400
    function getSize() {
        return width + "x" + height
    }
    Text {
        text: "Rectangle size is "
            + main.getSize()
        y: main.height / 3
        anchors.horizontalCenter:
            main.horizontalCenter
    }
    Item {
        anchors {
            left: parent.left
            top: parent.top
            margins: 5
        }
        Text {
            text: "Property is: " + main.value
        }
    }
    Component.onCompleted: console.log("Component.onCompleted!");

    states: [
        State {
            name: "On"; PropertyChanges { target: main; color: "white"}
        },
        State {
            name: "Off"; PropertyChanges { target: main; color: "black"}
        }
    ]
}


