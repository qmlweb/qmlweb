import QtQuick 2.0
import QtQuick.Controls 1.0

Text {
    property string title
    y: 20
    anchors.horizontalCenter: root.horizontalCenter
    font.pointSize: 28
    font.bold: true
    color: '#00a'
    text: '<b><u>' + title + '</u></b>'
}
