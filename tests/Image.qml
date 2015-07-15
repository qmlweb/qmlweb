import QtQuick 2.0;

Rectangle {
    id: root
    width: 700
    height: 400
    Title { id: title ; title: 'Image' }

    Rectangle {
        id: page
        width: 500
        height: 500
        x: page.left + 100
        y: title.bottom + 25
        color: '#fcc'
        border.width: 5
        border.color: 'blue'
        Image {
            id: inner1
            source: 'images/lizard.jpg'
            scale: 0.75
            fillMode: Image.PreserveAspectFit
            anchors.fill: parent
            Rectangle {
                anchors.fill: caption
                color: '#ddd'
            }
            Text {
                id: caption
                x: inner1.width - 400
                y: inner1.height - 50
                font.pointSize: 16
                color: '#00d'
                text: ' Lizard in Turkey - scale = ' + inner1.scale.toFixed(3)
            }
            MouseArea {
                anchors.fill: parent
                acceptedButtons: Qt.LeftButton | Qt.RightButton
                hoverEnabled: true
                onClicked: {
                    if (mouse.button == Qt.LeftButton)
                        inner1.scale += 0.025
                    else
                        inner1.scale -= 0.025
                }
                onEntered: {
                    page.color = '#ccf'
                }
                onExited: {
                    page.color = '#fcc'
                }
            }
        }
        Text {
            id: hint
            y: page.height - 80
            font.family: 'Consolas'
            font.pointSize: 14
            color: '#303'
            anchors.horizontalCenter: page.horizontalCenter
            text: '
Left Mouse Click:  increase image scale
Right Mouse Click: decrease image scale'
        }
    }
}