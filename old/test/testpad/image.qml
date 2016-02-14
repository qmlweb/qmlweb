import Qt 4.7
Rectangle {
    id: page
    width: 640; height: 500
    Image {
        id: img1
        source: "../images/flickr_5484507704_med.jpg"
        anchors.fill: page
        onStatusChanged: console.log('Image status is now: ' + img1.status);
    }
    Rectangle {
        anchors.fill: desc
        color: "white"
        opacity: 0.8
    }
    Text {
        id: desc
        color: "black"
        text: '"Moosic Mountain Hike" by Nicholas_t @ flickr'
        font.pointSize: 20
        anchors.bottom: page.bottom
        anchors.horizontalCenter: page.horizontalCenter
    }
}
