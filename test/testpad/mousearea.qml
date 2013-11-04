import Qt 4.7

// rotation is not completed yet

Rectangle {
    width: 600; height: 400
    id: page
    Text {
        text: "Click on rectangle in different positions to change its color";
        rotation: 2
        font.pointSize: 16
    }
    Rectangle {
        id: rect
        width: 200; height: 200
        color: "blue"
        anchors.centerIn: page
    }
    Rectangle {
        id: smallRect
        width: 40; height: 40
        color: "blue"
        anchors { left: rect.right; bottom: rect.bottom; leftMargin: 3 }
    }
    Rectangle {
        id: tinyRect
        width: 20; height: 20
        color: "grey"
        visible: mA.pressed
        anchors { left: rect.right; bottom: smallRect.top; margins: 3 }
    }
    Text {
        text: "More blue ->"
        color: "blue"
        anchors.left: rect.left; anchors.bottom: rect.top
    }
    Text {
        text: "More green ->"
        color: "green"
        rotation: 90 // Rotation still bugs a bit
        anchors.right: rect.left
        anchors.top: rect.top
    }
    MouseArea {
        id: mA
        anchors.fill: rect
        hoverEnabled: true
        onClicked: rect.color = Qt.rgba(0, mouse.y / rect.height, mouse.x / rect.width, 1);
        onPositionChanged: smallRect.color = Qt.rgba(0, mouse.y / rect.height, mouse.x / rect.width, 1);
    }
}
