// Importing was not supported while writing this example
//import QtQuick 1.0
Rectangle {
    id: main
    width: 600; height: 400
    color: "lightgray"
    function getSize() {
        return width + "x" + height
    }
    Text {
        text: "Rectangle size is "
            + main.getSize()
        font.pointSize: 32
        y: main.height / 3
        anchors.horizontalCenter:
            main.horizontalCenter
    }
}

