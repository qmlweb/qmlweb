import Qt 4.7
Rectangle {
    id: page
    width: 500; height: 200
    color: "white"
    
    Rectangle {
        anchors.fill: parent
        anchors.margins: 10
        anchors.bottomMargin: 20
        color: "lightgreen"

        Text {
            text: "Top left"
            anchors.left: parent.left
            anchors.top: parent.top
        }
        Text {
            text: "Top center"
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: parent.top
        }
        Text {
            text: "Top right"
            anchors.right: parent.right
            anchors.top: parent.top
        }
        Text {
            text: "Middle left"
            anchors.left: parent.left
            anchors.verticalCenter: parent.verticalCenter
        }
        Text {
            id: centeredText
            text: "Center"
            anchors.centerIn: parent
        }
        Text {
            text: "Middle right"
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
        }
        Text {
            text: "Bottom left"
            anchors.left: parent.left
            anchors.bottom: parent.bottom
        }
        Text {
            text: "Bottom center (10 Margin)"
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.bottom: parent.bottom
            anchors.margins: 10
        }
        Text {
            text: "Bottom right"
            anchors.right: parent.right
            anchors.bottom: parent.bottom
        }
        // Some specials
        
        // Rectangle as background for topOfCenter
        Rectangle {
            color: Qt.rgba(0.2, 0.5, 1, 1)
            anchors.fill: topOfCenter
        }
        Text {
            text: "Relative at 20, 20"
            color: "red"
            x: 20
            y: 20
        }
        Text {
            text: "Top of center"
            color: "darkgreen"
            id: topOfCenter
            anchors.bottom: centeredText.top
            anchors.horizontalCenter: parent.horizontalCenter
        }
        Text {
            text: "Right of top of center"
            color: "blue"
            anchors.left: topOfCenter.right
            anchors.top: topOfCenter.top
            anchors.leftMargin: 5
        }
        Text {
            text: "Left of center"
            color: "green"
            anchors.right: centeredText.left
            anchors.verticalCenter: parent.verticalCenter
            anchors.margins: 5
        }
    }
}
