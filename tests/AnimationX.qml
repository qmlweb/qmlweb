import QtQuick 2.0

Rectangle {
    width: page_AX.width + 100
    height: page_AX.height + 100

    Title { id: title_AX ; title: 'Animation' }

    Rectangle {
        id: page_AX
        width: 600
        height: 400
        anchors.top: title_AX.bottom
        anchors.topMargin: 30
        anchors.horizontalCenter: parent.horizontalCenter
        border.width: 1
        border.color: 'gray'
        Text {
            id: text_AX
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
            id: rect_AX
            x: 10
            anchors.top: text_AX.bottom + 20
            width: 100
            height: 100
            color: 'blue'
        }

        MouseArea {
            anchors.fill: page_AX
            acceptedButtons: Qt.LeftButton | Qt.RightButton
            function action(mouse) {
                var left = mouse.button === Qt.LeftButton
                var right = mouse.button === Qt.RightButton
                var shift = mouse.modifiers & Qt.ShiftModifier
                var alt = mouse.modifiers & Qt.AltModifier
                if (left && !shift && !alt) {
                    anim1_AX.from = rect_AX.x
                    anim1_AX.to = mouse.x
                    anim1_AX.start()
                } else if (right && !alt) {
                    anim2_AX.from = rect_AX.y
                    anim2_AX.to = mouse.y
                    anim2_AX.start()
                } else if (left && shift) {
                    anim3_AX.start()
                } else if (right && alt) {
                    rect_AX.color = 'red'
                } else if (left && alt) {
                    rect_AX.color = 'blue'
                }
            }
            onClicked: action(mouse)
        }

        NumberAnimation {
            id: anim1_AX
            target: rect_AX
            property: 'x'
            duration: 1000
        }
        NumberAnimation {
            id: anim2_AX
            target: rect_AX
            property: 'y'
            duration: 1000
        }
        NumberAnimation {
            id: anim3_AX
            target: rect_AX
            property: 'rotation'
            from: 0
            to: 360
            loops: 2
            alwaysRunToEnd: true
            duration: 500
        }
    }
}