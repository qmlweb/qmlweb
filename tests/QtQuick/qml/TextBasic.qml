import QtQuick 2.0

Rectangle {
    width: 20
    height: 20
    Text {
        id: text
        font.family: "Arial"
        font.pointSize: 14
        text: "hi"
        anchors.fill: parent
    }
    function test(){
        grab("")

        text.verticalAlignment = Text.AlignTop
        text.horizontalAlignment = Text.AlignLeft
        grab("tl")
        text.verticalAlignment = Text.AlignVCenter
        text.horizontalAlignment = Text.AlignHCenter
        grab("cc")
        text.verticalAlignment = Text.AlignBottom
        text.horizontalAlignment = Text.AlignRight
        grab("br")
    }
}
