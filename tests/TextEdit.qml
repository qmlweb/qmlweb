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
        /*
        Text {
            id: text
            anchors.fill: parent
            color: 'red'
            font.pointSize: 16
            text: parent.text
        }
        */
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
