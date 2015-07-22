import QtQuick 2.0

Rectangle {
    width: 700
    height: 250
    Title { id: title_TX ; title: 'Text' }

    Rectangle {
        id: page_TX
        width: 610
        height: 220
        anchors.top: title_TX.bottom + 50
        anchors.horizontalCenter: parent.horizontalCenter
        color: '#cfc'
        border.width: 15
        border.color: 'blue'
        Text {
            anchors.centerIn: page_TX
            font.pointSize: 18
            text:
'<b>Gallia</b> est omnis divisa <i>in partes tres</i>,
quarum unam incolunt <u>Belgae</u>, aliam <u>Aquitani</u>,
tertiam qui ipsorum lingua <u>Celtae</u>, nostra <u>Galli</u>
appellantur. Hi omnes lingua, institutis,
legibus inter se differunt.'
        }
    }
}