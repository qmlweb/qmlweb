import Qt 4.7

Rectangle {
    id: comp
    color: rectColor
    height: 100
    width: 300
    // We fetch the border-properties from greenRect for testing purposes
    border.width: greenRect.border.width
    border.color: greenRect.border.color
    default property alias kids: greenRect.children
    property string txt: "Foo"
    signal test(string newColor, int number)

    MouseArea {
        width: parent.width
        height: parent.height - greenRect.height
        onClicked: comp.test("lightpink", Math.floor(10 * Math.random()));
    }

    Text {
        anchors.horizontalCenter: parent.horizontalCenter
        y: 10
        text: number + " + " + comp2.number + " =  " + (number + comp2.number)
    }

    Rectangle {
        id: greenRect
        color: "lightgreen"
        border.width: 1
        border.color: "grey"
        height: 50
        width: parent.width
        anchors.bottom: parent.bottom

        MouseArea {
            anchors.fill: parent
            onClicked: comp.test("darkred", Math.floor(10 * Math.random()));
        }
    }
}
