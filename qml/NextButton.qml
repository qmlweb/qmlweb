import Qt 4.7

Rectangle {
  id: base
  property string source: '/images/go-next.png'

  Image {
    id: image
    source: base.source
    fillMode: Image.PreserveAspectFit
    anchors.fill: parent

    MouseArea {
      anchors.fill: parent
      acceptedButtons: Qt.LeftButton | Qt.RightButton
      onClicked: {
        if (image.source == '/images/go-next.png')
          image.source = '/images/go-previous.png';
        else
          image.source = '/images/go-next.png';
      }
    }
  }
}
