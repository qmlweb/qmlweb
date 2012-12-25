import QtQuick 1.1

Rectangle {
    id: page
    color: "white"
    width: 500; height: 200

    BorderImage {
        source: "../images/border.png"
        width: 100
        height: 130
        x: 50
        y: 35
        border.top: 20
        border.bottom: 20
        border.left: 20
        border.right: 20
    }

    BorderImage {
        source: "../images/border.png"
        horizontalTileMode: BorderImage.Repeat
        verticalTileMode: BorderImage.Repeat
        width: 100
        height: 130
        x: 200
        y: 35
        border.top: 20
        border.bottom: 20
        border.left: 20
        border.right: 20
    }

    BorderImage {
        source: "../images/border.png"
        horizontalTileMode: BorderImage.Round
        verticalTileMode: BorderImage.Round
        width: 100
        height: 130
        x: 350
        y: 35
        border.top: 20
        border.bottom: 20
        border.left: 20
        border.right: 20
    }
}
