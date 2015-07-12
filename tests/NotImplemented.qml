import QtQuick 2.0;

Rectangle {
    color: '#fdf'
    height: parent.height - 100
    width: parent.width - 100
    anchors {
            bottom: parent.bottom - 10
            horizontalCenter: parent.horizontalCenter
    }
    border.width: 3
    border.color: 'red'
    Text {
        id: not_implemented
        anchors.centerIn: parent
        font.pointSize: 24
        font.bold: true
        color: 'red'
        text: 'Not Implemented (yet)'
    }
}
