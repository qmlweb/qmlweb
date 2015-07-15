import QtQuick 2.0;
import QtQuick.Controls 1.0

Rectangle {
    id: root
    color: 'white'
    x: 50
    width: page.width

    Title { id: title ; title: 'ListView' }

Rectangle {
    id: page
    color: '#aab'
    width: 7 * 130 + 5
    property string source1: 'images/go-next.png'
    property string source2: 'images/go-previous.png'

    anchors.top: title.bottom
    anchors.topMargin: 30
    anchors.horizontalCenter: page.horizontalCenter

    ListModel {
        id: Cities

        ListElement {
            name: 'San Diego'
            country: 'USA'
            locale: 'en_US'
            tz: -480 }
        ListElement {
            name: 'New York'
            country: 'USA'
            locale: 'en_US'
            tz: -300 }
        ListElement {
            name: 'Berlin'
            country: 'Germany'
            locale: 'de_DE'
            tz: 60 }
        ListElement {
            name: 'Teheran'
            country: 'Iran'
            locale: 'fa_IR'
            tz:  210 }
        ListElement {
            name: 'Perth'
            country: 'Australia'
            locale: 'en_AU'
            tz: 480 }
        ListElement {
            name: 'Osaka'
            country: 'Japan'
            locale: 'jp_JP'
            tz: 540 }
    }

    ListView {
        id: lv_vertical
        model: Cities
        orientation: Qt.Vertical
        spacing: 5
        delegate: Rectangle {
            width: 125
            height: 40
            color: Cities.get(index).locale[0] == 'e' ? 'magenta' : 'lime'
            border.width: 1
            border.color: 'red'
            Image {
                id: image
                source: Cities.get(index).locale[0] == 'e' ? page.source1 : page.source2
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
            color: Cities.get(index).tz < 0 ? 'cyan' : 'lime'
            border.width: 1
            border.color: 'blue'
            Text {
                id: entryCities
                anchors.centerIn: parent
                text: Cities.get(index).name
            }
            MouseArea {
                id: mCity
                anchors.fill: parent
                onClicked: {
                    var city =  Cities.get(index)
                    info.text = 'CITY : ' + city.name +
                                '\n\ncountry : ' + city.country +
                                '\nlocale : ' + city.locale +
                                '\ntimezone : ' + city.tz
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
            color: '777'
            font.pointSize: 18
            font.bold: true
            text: 'Your text could be here'
        }
    }
}
}