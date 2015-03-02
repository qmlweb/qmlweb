// Importing was not supported while writing this example
import Qt 4.7
import QQuick.Controls 1.0 as Controls
import QQuick.Dialogs 1.0

Rectangle {
    id: main
    property int value: 5
    property bool novalue
    width: 600; height: 400
    property variant arr: [1, 2, "hello world", [1, 2, false]]
    property variant bindingArray: [1, 2, "hello world", [+1, main.value - 3, novalue]]
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
            text: "Property is:\t\t\t" + main.value
                    + ".\nUndefined boolean is:\t" + main.novalue
                    + ".\nArray is:\t\t\t\t"+ JSON.stringify(main.arr)
                    + ".\nArray with Binding:\t\t"+ JSON.stringify(main.bindingArray)
                    + ".";
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


