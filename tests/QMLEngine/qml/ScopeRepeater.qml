import QtQuick 2.0

/* A Flow is used because it will check the width of a new child that is added
 * to it (e.g. "new_item" below). This will happen when the Repeater creates a
 * new instance of "new_item" and then parents it to the Flow. If this happens
 * before the model's "the_width" role has been inserted into the scope of
 * "new_item", it will incorrectly resolve to "root.the_width" */
Flow {
  id: root

  Timer {
    interval: 1
    running: true
    onTriggered: {
      /* This needs to happen in a Timer, so that it is not with a
       * $createObject call that sets QmlWeb.engine.operationState =
       * QMLOperationState.Init */
      list_model.append({"the_width" : 200})
      root.yield(repeater.itemAt(0).width)
    }
  }

  // We shouldn't access this variable
  property int the_width: 100

  Repeater {
    id: repeater
    model: ListModel {
      id: list_model
    }
    Item {
      id: new_item
      height: 100
      width: the_width
    }
  }
}
