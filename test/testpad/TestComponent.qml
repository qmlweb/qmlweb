import Qt 4.7

Rectangle {
    id: comp
    color: "lightblue"
    height: 100
    width: 300
    border.width: 1
    border.color: "grey"
    default property alias kids: greenRect.children
    property string txt: "Foo"

    Rectangle {
        id: greenRect
        color: "lightgreen"
        height: 50
        width: parent.width
        anchors.bottom: parent.bottom
    }
}
