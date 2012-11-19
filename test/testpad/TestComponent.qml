import Qt 4.7

Rectangle {
    id: comp
    color: "lightblue"
    height: 100
    width: 300
    // We fetch the border-properties from greenRect for testing purposes
    border.width: greenRect.border.width
    border.color: greenRect.border.color
    default property alias kids: greenRect.children
    property string txt: "Foo"

    Rectangle {
        id: greenRect
        color: "lightgreen"
        border.width: 1
        border.color: "grey"
        height: 50
        width: parent.width
        anchors.bottom: parent.bottom
    }
}
