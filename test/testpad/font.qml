import QtQuick 1.1

Rectangle {
    id: page
    width: 700; height: 500
    color: "lightgray"
    property string lorem: "Lorem ipsum dolor sit \namet, consectetur adipisici elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. \nhippopotomonstrosesquipedaliophobia"

    Text {
        id: text1
        text: "Hello world!"
        font.pointSize: 24
    }
    Text {
        id: text2
        anchors.top: text1.bottom
        text: "Hello world!"
        color: "green"
        font.pixelSize: 24
    }
    Text {
        id: text3
        anchors.top: text2.bottom
        text: "Hello world!"
        font.bold: true
        font.italic: true
    }
    Text {
        id: text4
        anchors.top: text3.bottom
        text: "Hello world!"
        font.capitalization: Font.SmallCaps
    }
    Text {
        id: text5
        anchors.top: text4.bottom
        text: "Hello world!"
        font.capitalization: Font.Capitalize
    }
    Text {
        id: text6
        anchors.top: text5.bottom
        text: "Hello world!"
        font.capitalization: Font.AllLowercase
        font.letterSpacing: 5
    }
    Text {
        id: text7
        anchors.top: text6.bottom
        text: "Hello world!"
        font.capitalization: Font.AllUppercase
        font.strikeout: true
        font.underline: true
    }
    Text {
        id: text8
        anchors.top: text7.bottom
        text: "Hello world!"
        font.family: "monospace"
        font.strikeout: true
    }
    Text {
        id: text9
        anchors.top: text8.bottom
        text: "Hello world!"
        font.family: "'Times New Roman', Verdana, serif"
        font.underline: true
        font.wordSpacing: 10
    }
    Text {
        id: text10
        anchors.top: text9.bottom
        text: "Hello world!"
        font.pixelSize: 16
        font.weight: Font.Light
        font.family: "'Times New Roman', Verdana, serif"
    }
    Text {
        id: text11
        anchors.top: text10.bottom
        text: "Hello world!"
        font.pixelSize: 16
        font.weight: Font.DemiBold
        font.family: "'Times New Roman', Verdana, serif"
    }
    Text {
        id: text12
        anchors.top: text11.bottom
        text: "Hello world!"
        font.pixelSize: 16
        font.weight: Font.Bold
        font.family: "'Times New Roman', Verdana, serif"
    }
    Text {
        id: text13
        anchors.top: text12.bottom
        text: "Hello world!"
        font.pixelSize: 16
        font.weight: Font.Black
        font.family: "'Times New Roman', Verdana, serif"
    }
    Text {
        id: text14
        anchors.top: text13.bottom
        text: "Hello world!"
        font.pixelSize: 24
        style: Text.Outline
        styleColor: "#ff0000"
    }
    Text {
        id: text15
        anchors.top: text14.bottom
        text: "Hello world!"
        font.pixelSize: 24
        style: Text.Raised
        styleColor: "#ff0000"
    }
    Text {
        id: text16
        anchors.top: text15.bottom
        text: "Hello world!"
        font.pixelSize: 24
        style: Text.Sunken
        styleColor: "#ff0000"
    }

    Rectangle {
        x: 250
        y: 10
        width: 200
        height: 112
        color: "lightblue"

        Text {
            width: parent.width
            height: parent.height
            text: page.lorem
            wrapMode: Text.Wrap
            horizontalAlignment: Text.AlignLeft
        }
    }

    Rectangle {
        x: 250
        y: 132
        width: 200
        height: 112
        color: "lightblue"

        Text {
            width: parent.width
            height: parent.height
            text: page.lorem
            wrapMode: Text.Wrap
            horizontalAlignment: Text.AlignRight
        }
    }

    Rectangle {
        x: 250
        y: 254
        width: 200
        height: 112
        color: "lightblue"

        Text {
            width: parent.width
            height: parent.height
            text: page.lorem
            wrapMode: Text.Wrap
            horizontalAlignment: Text.AlignHCenter
        }
    }

    Rectangle {
        x: 250
        y: 376
        width: 200
        height: 112
        color: "lightblue"

        Text {
            width: parent.width
            height: parent.height
            text: page.lorem
            wrapMode: Text.Wrap
            horizontalAlignment: Text.AlignJustify
        }
    }

    Rectangle {
        x: 460
        y: 10
        width: 200
        height: 112
        color: "yellow"

        Text {
            width: parent.width
            height: parent.height
            text: page.lorem
        }
    }

    Rectangle {
        x: 460
        y: 132
        width: 200
        height: 112
        color: "yellow"

        Text {
            width: parent.width
            height: parent.height
            wrapMode: Text.WordWrap
            text: page.lorem
        }
    }

    Rectangle {
        x: 460
        y: 254
        width: 200
        height: 112
        color: "yellow"

        Text {
            width: parent.width
            height: parent.height
            wrapMode: Text.WrapAnywhere
            text: page.lorem
            lineHeightMode: Text.FixedHeight
            lineHeight: 10
        }
    }

    Rectangle {
        x: 460
        y: 376
        width: 200
        height: 112
        color: "yellow"

        Text {
            width: parent.width
            height: parent.height
            wrapMode: Text.Wrap
            text: page.lorem
            lineHeight: 1.2
        }
    }
}
