import Qt 4.7

Rectangle {
    id: page
    width: 600
    height: 400
    Text {
        text: "Click to move rectangle horizontally"
        font.pointSize: 16
    }
    Rectangle {
        id: rect
        x: 0
        y: 40
        width: 200; height: 200
        color: "blue"
    }
    MouseArea {
        anchors.fill: page
        function act(mouse) {
            anim.property = "x"
            anim.from = rect.x
            anim.to = mouse.x
            anim.restart();
        }
        onClicked: act(mouse)
    }
    NumberAnimation {
        id: anim
        target: rect
        duration: 1000
    }
}
