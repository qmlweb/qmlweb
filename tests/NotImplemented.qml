import QtQuick 2.0

Rectangle {
    color: '#fef'
    height: 100
    width: parent.width - 100
    anchors {
            horizontalCenter: parent.horizontalCenter
    }
    border.width: 3
    border.color: 'red'
    Text {
        anchors.centerIn: parent
        font.pointSize: 24
        font.bold: true
        color: 'red'
        text: 'To Be Done'
    }
}
