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
        Text {
            text: "Property is: " + main.value
        }
    
    }
    Component.onCompleted: console.log("Component.onCompleted!");
}


