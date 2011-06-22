{
$class: "QMLDocument",
$imports: [ { item: "QtQuick", version: "1.0" } ],
$children: [
    {
    $class: "Rectangle",
    id: "page",
    width: 500,
    height: 300,
    color: "lightgray",
    $children: [
        {
        $class: "Text",
        id: "helloText",
        text: QMLBinding("'Size:' + page.width + 'x' + page.height"),
        y: QMLBinding("page.height / 3"),
        anchors: {
            horizontalCenter: QMLBinding("page.horizontalCenter"),
            },
        font: {
            pointSize: 24,
            bold: true
            }
        },
        {
        $class: "Timer",
        interval: 750,
        running: true,
        repeat: true,
        onTriggered: QMLBinding("page.width += 1; helloText.visible = !helloText.visible"),
        } ]
    } ]
};
