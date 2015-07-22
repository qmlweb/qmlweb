import QtQuick 2.0;

Rectangle {
    width: 700
    height: 700
    Title { id: title_ImX ; title: 'Image' }

    Rectangle {
        id: page_ImX
        width: 500
        height: 500
        anchors.top: title_ImX.bottom + 50
        anchors.horizontalCenter: parent.horizontalCenter
        color: '#fcc'
        border.width: 5
        border.color: 'blue'
        Image {
            id: inner1_ImX
            source: 'images/lizard.jpg'
            scale: 0.75
            fillMode: Image.PreserveAspectFit
            anchors.fill: parent
            Rectangle {
                anchors.fill: caption_ImX
                color: '#ddd'
            }
            Text {
                id: caption_ImX
                x: inner1_ImX.width - 400
                y: inner1_ImX.height - 50
                font.pointSize: 16
                color: '#00d'
                text: ' Lizard in Turkey - scale = ' + inner1_ImX.scale.toFixed(3)
            }
            MouseArea {
                anchors.fill: parent
                acceptedButtons: Qt.LeftButton | Qt.RightButton
                hoverEnabled: true
                onClicked: {
                    if (mouse.button == Qt.LeftButton)
                        inner1_ImX.scale += 0.025
                    else
                        inner1_ImX.scale -= 0.025
                }
                onEntered: {
                    page_ImX.color = '#ccf'
                }
                onExited: {
                    page_ImX.color = '#fcc'
                }
            }
        }
        Text {
            id: hint_ImX
            y: page_ImX.height - 80
            font.family: 'Consolas'
            font.pointSize: 14
            color: '#303'
            anchors.horizontalCenter: page_ImX.horizontalCenter
            text: '
Left Mouse Click:  increase image scale
Right Mouse Click: decrease image scale'
        }
    }
}
