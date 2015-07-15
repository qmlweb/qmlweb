import QtQuick 2.0;

Rectangle {
    id: root
    width: 500
    height: 400
    Title { id: title ; title: 'HelloWorld' }

    Rectangle {
        id: page
        color: 'white'
        Rectangle {
            id: base
            width: 320
            height: 60
            x: root.left + 90
            y: title.bottom + 25
            color: '#ffe'
            radius: 20
            border.width: 3
            border.color: 'blue'
            Text {
                id: inner1
                anchors.centerIn: base
                font.pointSize: 20
                color: '#a0a'
                text: 'Hello World from QML'
            }
        }
        Text {
            id: inner2
            anchors.top: base.bottom + 20
            anchors.horizontalCenter: base.horizontalCenter
            font.pointSize: 36
            font.bold: true
            color: '#a00'
            text: '!!!'
        }
        Text {
            id: inner3
            anchors.top: inner2.bottom + 20
            anchors.horizontalCenter: base.horizontalCenter
            font.pointSize: 12
            font.bold: true
            color: '#00a'
            text: '<u>Every software needs a HelloWorld</u>'
        }
    }
}