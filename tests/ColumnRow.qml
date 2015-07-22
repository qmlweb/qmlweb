import QtQuick 2.0

Rectangle {
    width: 700
    height: 440

    Title { id: title_CR ; title: 'ColumnRow' }
    PlanetsModel { id: planets }

    Rectangle {
        id: page_CR
        width: 500
        height: 370
        anchors.top: title_CR.bottom
        anchors.topMargin: 30
        anchors.horizontalCenter: parent.horizontalCenter
        border.width: 1
        border.color: 'red'

        Column {
            id: planet_CR
            y: 20
            spacing: 10
            Repeater {
                model: planets
                Rectangle {
                    width: 120
                    height: 32
                    x: 10
                    border.width: 2
                    border.color: 'black'
                    radius: 8
                    color: '#111'
                    Rectangle {
                        id: color_CR
                        x: 5
                        anchors.verticalCenter: parent.verticalCenter
                        width: 16
                        height: 16
                        radius: 8
                        color: surfaceColor
                    }
                    Text {
                        id: text_CR
                        anchors.left: color_CR.right + 8
                        anchors.verticalCenter: parent.verticalCenter
                        font.pointSize: 16
                        color: 'white'
                        text: name
                    }
                }
            }
        }

        Column {
            id: column_CR
            anchors.left: planet_CR.right + 50
            anchors.verticalCenter: planet_CR.verticalCenter
            spacing: 20

            Rectangle { color: 'red'; width: 50; height: 50 }
            Rectangle { color: 'green'; width: 50; height: 50 }
            Rectangle { color: 'blue'; width: 50; height: 50 }
        }

        Row {
            anchors.left: column_CR.right + 50
            anchors.verticalCenter: planet_CR.verticalCenter
            spacing: 20

            Rectangle { color: 'red'; width: 50; height: 50 }
            Rectangle { color: 'green'; width: 50; height: 50 }
            Rectangle { color: 'blue'; width: 50; height: 50 }
        }

    }
}