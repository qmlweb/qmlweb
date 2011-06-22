import Qt 4.7
Rectangle {
    id: page
    width: 500; height: 200
    color: "white"
    Text {
        text: "Top left"
        anchors.left: page.left
        anchors.top: page.top
    }
    Text {
        text: "Top center"
        anchors.horizontalCenter: page.horizontalCenter
        anchors.top: page.top
    }
    Text {
        text: "Top right"
        anchors.right: page.right
        anchors.top: page.top
    }
    Text {
        text: "Middle left"
        anchors.left: page.left
        anchors.verticalCenter: page.verticalCenter
    }
    Text {
        id: centeredText
        text: "Center"
        anchors.centerIn: page
    }
    Text {
        text: "Middle right"
        anchors.right: page.right
        anchors.verticalCenter: page.verticalCenter
    }
    Text {
        text: "Bottom left"
        anchors.left: page.left
        anchors.bottom: page.bottom
    }
    Text {
        text: "Bottom center"
        anchors.horizontalCenter: page.horizontalCenter
        anchors.bottom: page.bottom
    }
    Text {
        text: "Bottom right"
        anchors.right: page.right
        anchors.bottom: page.bottom
    }
    // Some specials
    
    // Rectangle as background for topOfCenter
    Rectangle {
        color: "lightblue"
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
        color: "green"
        id: topOfCenter
        anchors.bottom: centeredText.top
        anchors.horizontalCenter: page.horizontalCenter
    }
    Text {
        text: "Right of top of center"
        color: "blue"
        anchors.left: topOfCenter.right
        anchors.top: topOfCenter.top
    }
    Text {
        text: "Left of center"
        color: "green"
        anchors.right: centeredText.left
        anchors.verticalCenter: page.verticalCenter
    }
}
