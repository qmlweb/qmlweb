import QtQuick 2.0

Rectangle {
    id: root
    color: 'white'
    x: 50
    width: page.width

    Title { id: title ; title: 'ListView' }
    CitiesModel { id: Cities }

    Rectangle {
        id: page
        color: '#aab'
        width: 7 * 130 + 5
        property string source1: 'images/go-next.png'
        property string source2: 'images/go-previous.png'

        anchors.top: title.bottom
        anchors.topMargin: 30
        anchors.horizontalCenter: page.horizontalCenter

        ListView {
            id: lv_vertical
            model: Cities
            orientation: Qt.Vertical
            spacing: 5
            delegate: Rectangle {
                width: 125
                height: 40
                color: locale[0] == 'e' ? 'magenta' : 'lime'
                border.width: 1
                border.color: 'red'
                Image {
                    id: image
                    source: locale[0] == 'e' ? page.source1 : page.source2
                    fillMode: Image.PreserveAspectFit
                    anchors.fill: parent
                }
                MouseArea {
                  anchors.fill: parent
                  acceptedButtons: Qt.LeftButton | Qt.RightButton
                  onClicked: {
                    info.text = 'clicked in ListView\nsource = ' + image.source
                  }
              }
            }
        }

        ListView {
            id: lv_horizontal
            model: Cities
            orientation: Qt.Horizontal
            x: 130
            spacing: 5
            delegate: Rectangle {
                width: 125
                height: 40
                color: tz < 0 ? 'cyan' : 'lime'
                border.width: 1
                border.color: 'blue'
                Text {
                    id: entryCities
                    anchors.centerIn: parent
                    text: name
                }
                MouseArea {
                    id: mCity
                    anchors.fill: parent
                    onClicked: {
                        info.text = 'CITY : ' + name +
                                    '\n\ncountry : ' + country +
                                    '\nlocale : ' + locale +
                                    '\ntimezone : ' + tz
                    }
                }
            }
        }

        Rectangle {
            id: reporter
            x: 130
            y:  46
            width:  page.width - 130
            height: 229
            color: '#aaf'
            Text {
                id: info
                anchors.centerIn: parent
                color: '#777'
                font.pointSize: 18
                font.bold: true
                text: 'Your text could be here\nNot working with Windows10 Edge'
            }
        }
    }
}