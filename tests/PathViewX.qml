import QtQuick 2.0

Rectangle {
    color: 'white'
    width: 700
    height: 700

    Title { id: title_PV ; title: 'PathView' }
    NotImplemented { anchors.top: title_PV.bottom + 25 }
}
/*
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

    Component {
        id: delegate
        Column {
            id: wrapper
            Image {
                anchors.horizontalCenter: nameText.horizontalCenter
                width: 64; height: 64
                source: icon
            }
            Text {
                id: nameText
                text: name
                font.pointSize: 16
                color: wrapper.PathView.isCurrentItem ? "red" : "black"
            }
        }
    }

    PathView {
        anchors.fill: parent
        model: Cities
        delegate: delegate
        path: Path {
            startX: 120; startY: 100
            PathQuad { x: 120; y: 25; controlX: 260; controlY: 75 }
            PathQuad { x: 120; y: 100; controlX: -20; controlY: 75 }
        }
    }
}
*/
