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
        $class: "Text",
        text: "Click to move rectangle",
        font: { pointSize: 16 },
        },
        {
        $class: "Rectangle",
        id: "rect",
        x: 0,
        y: 40,
        width: 200,
        height: 200,
        color: "blue",
        },
        {
        $class: "MouseArea",
        anchors: { fill: QMLBinding("page") },
        onClicked: QMLBinding("anim.from = rect.x; anim.to = mouse.x; anim.restart()"),
        },
        {
        $class: "NumberAnimation",
        id: "anim",
        target: QMLBinding("rect"),
        property: "x",
        duration: 1000,
        }
        ]
    } ]
};
