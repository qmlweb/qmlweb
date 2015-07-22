import QtQuick 2.0;

Rectangle {
    width: 700
    height: 500
    Title { id: title_HW ; title: 'HelloWorld' }

    Rectangle {
        anchors.top: title_HW.bottom + 50
        anchors.horizontalCenter: parent.horizontalCenter
        color: '#0f0'
        Rectangle {
            id: inner1_HW
            width: 320
            height: 60
            color: '#ffc'
            radius: 20
            border.width: 3
            border.color: 'blue'
            anchors.horizontalCenter: parent.horizontalCenter
            Text {
                anchors.centerIn: inner1_HW
                font.pointSize: 20
                color: '#a0a'
                text: 'Hello World from QML'
            }
        }
        Text {
            id: inner2_HW
            anchors.top: inner1_HW.bottom + 20
            anchors.horizontalCenter: parent.horizontalCenter
            font.pointSize: 36
            font.bold: true
            color: '#a00'
            text: '!!!'
        }
        Text {
            id: inner3_HW
            anchors.top: inner2_HW.bottom + 20
            anchors.horizontalCenter: parent.horizontalCenter
            font.pointSize: 12
            font.bold: true
            color: '#00a'
            text: '<u>Every software needs a HelloWorld</u>'
        }
    }
}