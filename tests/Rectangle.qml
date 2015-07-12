import QtQuick 2.0

Rectangle {
    id: root
    width: 520
    height: 300
    x: 200
    y: 200
    color: '#ccf'
    border.width: 25
    border.color: 'magenta'
    Rectangle {
        id: inner1
        width: 100
        height: 100
        x: 100
        y: 100
        color: 'red'
    }
    Rectangle {
        id: inner2
        width: 100
        height: 100
        x: 210
        y: 100
        color: 'green'
    }
    Rectangle {
        id: inner3
        width: 100
        height: 100
        x: 320
        y: 100
        color: 'blue'
    }
}