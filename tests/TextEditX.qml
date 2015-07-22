import QtQuick 2.0
import QtQuick.Controls 1.0

Rectangle {
    color: 'white'
    width: 600
    height: 600

    Title { id: title_TX ; title: 'TextEdit' }
    TextEdit {
        id: edit_TX
        width: 500
        height: 400
        anchors.top: title_TX.bottom
        anchors.topMargin: 30
        anchors.horizontalCenter: parent.horizontalCenter
        color: 'blue'
        font.pointSize: 13.5
        font.underline: true
        css.backgroundColor: '#efe'
        css.borderRadius: '25px'
        css.border: '3px dotted red'

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
        anchors.top: edit_TX.bottom
        anchors.topMargin: 15
        anchors.horizontalCenter: edit_TX.horizontalCenter
        color: '#363'
        font.pointSize: 16
        text: 'Lines = ' + edit_TX.lineCount + '  '
            + 'Chars = ' + edit_TX.length
    }
}
