{
$class: "QMLDocument",
$imports: [ { item: "QtQuick", version: "1.0" } ],
$children: [
    {
    $class: "Rectangle",
    id: "page",
    width: 600,
    height: 400,
    $children: [
        {
        $class: "Rectangle",
        id: "rect",
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        color: "green",
        },
        {
        $class: "SequentialAnimation",
        running: true,
        loops: 3,
        $children: [
            {
            $class: "NumberAnimation",
            target: QMLBinding("rect"),
            property: "x",
            to: QMLBinding("page.width - rect.width"),
            duration: 1000,
            },
            {
            $class: "NumberAnimation",
            target: QMLBinding("rect"),
            property: "y",
            to: QMLBinding("page.height - rect.height"),
            duration: 1000,
            },
            {
            $class: "NumberAnimation",
            target: QMLBinding("rect"),
            property: "x",
            to: 0,
            duration: 500,
            },
            {
            $class: "NumberAnimation",
            target: QMLBinding("rect"),
            property: "y",
            to: 0,
            duration: 500,
            },
            ]
        },
        {
        $class: "Text",
        id: "pp22",
        text: "Round and round and round we go,",
        anchors: {
            centerIn: QMLBinding("page"),
            },
        },
        {
        $class: "Text",
        text: "when I was just about ready for a trip to the beach...",
        anchors: {
            top: QMLBinding("pp22.bottom"),
            horizontalCenter: QMLBinding("page.horizontalCenter"),
            },
        },
        ]
    } ]
};
