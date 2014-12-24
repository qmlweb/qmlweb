import Qt 5.4

Rectangle {
  property var    model
  property string attribute

  color: 'red'
  height: key.height
  anchors {
    left:  parent.left
    right: parent.right
  }

  Text {
    id: key
    text: attribute + ':'
  }

  Text {
    id: value
    text: { return model[attribute] }
    anchors.right: parent.right
  }
}
