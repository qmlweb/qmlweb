import QtQuick 1.0

Rectangle {
    id: page
    width: 500; height: 200
    color: "lightgray"

    Text {
        text: "Hello world!"
        anchors.centerIn: page
        font.pointSize: 24;
    }
}
