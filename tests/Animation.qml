import QtQuick 2.0

Rectangle {
    id: root
    width: page.width + 100
    height: page.height + 100

    Title { id: title ; title: 'Animation' }

    Rectangle {
        id: page
        width: 600
        height: 400
        anchors.top: title.bottom
        anchors.topMargin: 30
        anchors.horizontalCenter: root.horizontalCenter
        border.width: 1
        border.color: 'gray'
        Text {
            id: text
            x: 20
            y: 20
            text:
'Left Mouse only \t translate X
Right Mouse only \t translate Y
Left Mouse & Shift \t rotate
Left Mouse & Alt \t blue
Right Mouse & Alt \t red'
            font.pointSize: 14
        }

        Rectangle {
            id: rect
            x: 10
            anchors.top: text.bottom + 20
            width: 100
            height: 100
            color: 'blue'
        }

        MouseArea {
            anchors.fill: page
            acceptedButtons: Qt.LeftButton | Qt.RightButton
            function action(mouse) {
                var left = mouse.button === Qt.LeftButton
                var right = mouse.button === Qt.RightButton
                var shift = mouse.modifiers & Qt.ShiftModifier
                var alt = mouse.modifiers & Qt.AltModifier
                if (left && !shift && !alt) {
                    anim1.from = rect.x
                    anim1.to = mouse.x
                    anim1.start()
                } else if (right && !alt) {
                    anim2.from = rect.y
                    anim2.to = mouse.y
                    anim2.start()
                } else if (left && shift) {
                    anim3.start()
                } else if (right && alt) {
                    rect.color = 'red'
                } else if (left && alt) {
                    rect.color = 'blue'
                }
            }
            onClicked: action(mouse)
            onDoubleClicked: { rect.color = 'green' }
        }

        NumberAnimation {
            id: anim1
            target: rect
            property: 'x'
            duration: 1000
        }
        NumberAnimation {
            id: anim2
            target: rect
            property: 'y'
            duration: 1000
        }
        NumberAnimation {
            id: anim3
            target: rect
            property: 'rotation'
            from: 0
            to: 360
            loops: 2
            alwaysRunToEnd: true
            duration: 500
        }
    }
}