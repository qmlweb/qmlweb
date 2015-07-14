import QtQuick 2.0
import QtQuick.Controls 1.0

Rectangle {
    id: root
    color: 'white'
    width: 500

    Text {
        id: title
        y: 20
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
        anchors.top: title.bottom
        anchors.topMargin: 30
        anchors.left: 100
        color: 'blue'
        font.pointSize: 13
        font.underline: true
        css.backgroundColor: '#efe'

        text:
"To be, or not to be: that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take arms against a sea of troubles,
And by opposing end them? To die: to sleep;
No more; and by a sleep to say we end
The heart-ache and the thousand natural shocks
That flesh is heir to, 'tis a consummation
Devoutly to be wish'd. To die, to sleep;
To sleep: perchance to dream: ay, there's the rub;
For in that sleep of death what dreams may come"
    }
    Text {
        id: info
        anchors.horizontalCenter: text_edit.horizontalCenter
        anchors.top: text_edit.bottom
        anchors.topMargin: 15
        color: '#363'
        font.pointSize: 16
        text: 'Lines = ' + text_edit.lineCount + '  '
            + 'Chars = ' + text_edit.length
    }
}
