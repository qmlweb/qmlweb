// Importing was not supported while writing this example
import Qt 4.7
Rectangle {
    id: main
    property int value: 5
    property bool novalue
    width: 600; height: 400
    function getSize() {
        return width + "x" + height
    }
    Text {
        text: "Rectangle size is "
            + main.getSize()
        y: {
            if (main.height > 100)
                return main.height / 3;
            else
                return main.height / 2;
        }
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
            text: "Property is: " + main.value + ", undefined boolean is: " + main.novalue
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


