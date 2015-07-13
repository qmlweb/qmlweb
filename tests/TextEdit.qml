import QtQuick 2.0
import QtQuick.Controls 1.0

Rectangle {
    id: page
    color: 'white'
    width: 500

    Text {
        id: title
        anchors.horizontalCenter: text_edit.horizontalCenter
        font.pointSize: 28
        font.bold: true
        color: '#00a'
        text: '<b><u>TextEdit</u></b>'
    }
    TextEdit {
        id: text_edit
        width: 500
        height: 400
        anchors.top: title.bottom + 30
        anchors.left: 100
        font.bold: true

        text:
'Habe nun, ach! Philosophie,
Juristerei und Medizin,
Und leider auch Theologie
Durchaus studiert, mit heißem Bemühn.
Da steh ich nun, ich armer Tor!
Und bin so klug als wie zuvor;
Heiße Magister, heiße Doktor gar
Und ziehe schon an die zehen Jahr
Herauf, herab und quer und krumm
Meine Schüler an der Nase herum'
    }

    Text {
        id: info
        anchors.left: text_edit.left
        anchors.top: text_edit.bottom + 20
        color: 'red'
        font.pointSize: 16
        text: 'Lines = ' + text_edit.lineCount + '  '
            + 'Chars = ' + text_edit.length
    }
}
