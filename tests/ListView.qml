import QtQuick 2.4;
import QtQuick.Controls 1.4

Rectangle {
    id: root
    color: '#aab'
    property string source1: 'images/go-next.png'
    property string source2: 'images/go-previous.png'

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
                source: Cities.get(index).locale[0] == 'e' ? root.source1 : root.source2
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
        width:  780
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
