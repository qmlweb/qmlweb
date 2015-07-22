import QtQuick 2.0

Rectangle {
    width: 700
    height: 400
    Title { id: title_RA ; title: 'Rectangle' }

    Rectangle {
        id: page_RA
        width: 520
        height: 300
        anchors.top: title_RA.bottom + 50
        anchors.horizontalCenter: parent.horizontalCenter
        color: '#ccf'
        border.width: 25
        border.color: 'magenta'
        Rectangle {
            width: 100
            height: 100
            x: 100
            y: 100
            color: 'red'
        }
        Rectangle {
            width: 100
            height: 100
            x: 210
            y: 100
            color: 'green'
        }
        Rectangle {
            width: 100
            height: 100
            x: 320
            y: 100
            color: 'blue'
        }
    }
}