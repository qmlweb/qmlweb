import QtQuick 2.0;

Rectangle {
    id: root
    color: 'white'
    x: 100

    Rectangle {
        id: page
        color: 'lightcyan'
        y: 30
        width: 500
        height: output.bottom + 10
        border.width: 1
        border.color: 'red'

        Title {
            id: title
            title: 'Loader'
            anchors.horizontalCenter: page.horizontalCenter
        }
        Loader { id: pageLoader }

        TextInput {
            id: input
            text: 'HelloWorld'
            width: 400
            anchors.top: title.bottom
            anchors.topMargin: 20
            anchors.horizontalCenter: page.horizontalCenter

            onAccepted: {
                src = '/files3/' + text
                pageLoader.setSource(src) //, null)
                output.text = pageLoader.qmlSource
            }
        }

        TextEdit {
            id: output
            width: 400
            height: 400
            anchors.horizontalCenter: page.horizontalCenter
            anchors.top: input.bottom
            anchors.topMargin: 20
            font.bold: true
            text: ''
        }
    }
}