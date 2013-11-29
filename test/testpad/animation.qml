import Qt 4.7

Rectangle {
    id: page
    width: 600
    height: 400
    Text {
        text: "Click to move rectangle horizontally."
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
        acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton
        function act(mouse) {
            anim.property = "x"
            anim.from = rect.x
            anim.to = mouse.x
            anim2.to = mouse.x > rect.x ? 90 : -90
            if (mouse.button === Qt.RightButton) {
                anim.stop();
                anim2.running = false;
            } else if (mouse.button === Qt.MiddleButton) {
                anim.paused = !anim.paused;
                anim2.paused = !anim2.paused;
            } else {
                anim.restart();
                anim2.running = true;
            }
        }
        onClicked: act(mouse)
    }
    NumberAnimation {
        id: anim
        target: rect
        duration: 1000
    }
    NumberAnimation {
        id: anim2
        target: rect
        property: "rotation"
        from: 0
        to: 90
        loops: 4
        alwaysRunToEnd: true
        running: true
        duration: 250
    }
}
