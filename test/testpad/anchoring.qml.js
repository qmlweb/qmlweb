{
$class: "QMLDocument",
$imports: [ { item: "QtQuick", version: "1.0" } ],
$children: [
    {
    $class: "Rectangle",
    id: "page",
    width: 500,
    height: 200,
    color: "white",
    $children: [
        {
        $class: "Text",
        text: "Top left",
        anchors: {
            left: QMLBinding("page.left"),
            top: QMLBinding("page.top"),
            },
        },
        {
        $class: "Text",
        text: "Top center",
        anchors: {
            horizontalCenter: QMLBinding("page.horizontalCenter"),
            top: QMLBinding("page.top"),
            },
        },
        {
        $class: "Text",
        text: "Top right",
        anchors: {
            right: QMLBinding("page.right"),
            top: QMLBinding("page.top"),
            },
        },
        {
        $class: "Text",
        text: "Middle left",
        anchors: {
            left: QMLBinding("page.left"),
            verticalCenter: QMLBinding("page.verticalCenter"),
            },
        },
        {
        $class: "Text",
        id: "centeredText",
        text: "Center",
        anchors: {
            centerIn: QMLBinding("page"),
            },
        },
        {
        $class: "Text",
        text: "Middle right",
        anchors: {
            right: QMLBinding("page.right"),
            verticalCenter: QMLBinding("page.verticalCenter"),
            },
        },
        {
        $class: "Text",
        text: "Bottom left",
        anchors: {
            left: QMLBinding("page.left"),
            bottom: QMLBinding("page.bottom"),
            },
        },
        {
        $class: "Text",
        text: "Bottom center",
        anchors: {
            horizontalCenter: QMLBinding("page.horizontalCenter"),
            bottom: QMLBinding("page.bottom"),
            },
        },
        {
        $class: "Text",
        text: "Bottom right",
        anchors: {
            right: QMLBinding("page.right"),
            bottom: QMLBinding("page.bottom"),
            },
        },
        
        // Some specials
        { // Rectangle as background for topOfCenter
        $class: "Rectangle",
        color: "lightblue",
        anchors: {
            fill: QMLBinding("topOfCenter"),
        }
        },
        {
        $class: "Text",
        text: "Relative at 20, 20",
        color: "red",
        x: 20,
        y: 20,
        },
        {
        $class: "Text",
        text: "Top of center",
        id: "topOfCenter",
        color: "green",
        anchors: {
            bottom: QMLBinding("centeredText.top"),
            horizontalCenter: QMLBinding("page.horizontalCenter"),
            },
        },
        {
        $class: "Text",
        text: "Right of top of center",
        color: "blue",
        anchors: {
            left: QMLBinding("topOfCenter.right"),
            top: QMLBinding("topOfCenter.top"),
            },
        },
        {
        $class: "Text",
        text: "Left of center",
        color: "green",
        anchors: {
            right: QMLBinding("centeredText.left"),
            verticalCenter: QMLBinding("page.verticalCenter"),
            },
        },

         ]
    } ]
};
