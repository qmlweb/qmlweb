import QtQuick 1.1

Rectangle {
    id: page
    width: 800
    height: 300
    color: "lightgrey"

    property int number: 5
    property string rectColor: "palegoldenrod"

    TestComponent {
        x: 50
        y: 100
        width: 250
        height: 90
        onTest: {
            color = newColor;
            console.log("random number: " + number);
        }

        Text {
            anchors.centerIn: parent
            text: "Hello World!"
        }
    }

    TestComponent {
        id: comp2
        x: 450
        y: 100
        txt: "Booh!"

        property int number: 6
    }
}