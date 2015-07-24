import QtQuick 2.0

Rectangle {
    width: Cities.count*130+125+50
    height: Cities.count*45+40
    color: 'white'
 
    Title { id: title_LV ; title: 'ListView' }
    CitiesModel { id: Cities }

    Rectangle {
        id: page_LV
        x: 50
        width: parent.width
        height: parent.height
        property string source1: 'images/go-next.png'
        property string source2: 'images/go-previous.png'

        anchors.top: title_LV.bottom
        anchors.topMargin: 30
        anchors.horizontalCenter: page_LV.horizontalCenter

        ListView {
            id: vertical_LV
            model: Cities
            orientation: Qt.Vertical
            width: 130
            spacing: 5
            delegate: Rectangle {
                width: 125
                height: 40
                color: locale[0] == 'e' ? 'magenta' : 'lime'
                border.width: 1
                border.color: 'red'
                Image {
                    id: image_LV
                    source: locale[0] == 'e' ?
                        page_LV.source1 : page_LV.source2
                    fillMode: Image.PreserveAspectFit
                    anchors.fill: parent
                }
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        info_LV.text = 'clicked in ListView\nsource = '
                        + image_LV.source
                  }
              }
            }
        }

        ListView {
            id: horizontal_LV
            model: Cities
            orientation: Qt.Horizontal
            anchors.left: vertical_LV.right
            height: 40
            spacing: 5
            delegate: Rectangle {
                width: 125
                height: 40
                color: tz < 0 ? 'cyan' : 'lime'
                border.width: 1
                border.color: 'blue'
                Text {
                    anchors.centerIn: parent
                    text: name
                }
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        info_LV.text = 'CITY : ' + name
                        + '\n\ncountry : ' + country
                        + '\nlocale : ' + locale
                        + '\nUTC offset : ' + tz + ' min'
                    }
                }
            }
        }

        Rectangle {
            anchors.top: horizontal_LV.bottom + 5
            anchors.left: vertical_LV.right
            width: Cities.count*130+5
            height: (Cities.count-1)*45+5
            color: '#aaf'
            Text {
                id: info_LV
                anchors.centerIn: parent
                color: '#777'
                font.pointSize: 18
                font.bold: true
                text:
'Your text could be here
Not working with Windows10 Edge'
            }
        }
    }
}