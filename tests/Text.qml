import QtQuick 2.0;

Rectangle {
    id: root
    width: 610
    height: 200
    x: 200
    y: 200
    color: '#cfc'
    border.width: 15
    border.color: 'blue'
    Text {
        id: inner1
        anchors.centerIn: root
        font.pointSize: 18
        text:
'<b>Gallia</b> est omnis divisa <i>in partes tres</i>,
quarum unam incolunt <u>Belgae</u>, aliam <u>Aquitani</u>,
tertiam qui ipsorum lingua <u>Celtae</u>, nostra <u>Galli</u>
appellantur. Hi omnes lingua, institutis,
legibus inter se differunt.'
    }
}