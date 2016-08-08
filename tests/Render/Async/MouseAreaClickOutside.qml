import QtQuick 2.0

Rectangle {
  id: qml
  width: 20
  height: 20
  property bool pressed: mouse_area.pressed
  MouseArea {
    id: mouse_area
    width: 10
    height: 10
  }

  Timer {
    interval: 100
    running: window !== undefined
    onTriggered: {
      function send_mouse_event(event, x, y) {
        window.top.callPhantom("sendEvent",
          [event, x+qml.dom.offsetLeft, y+qml.dom.offsetTop]);
      }
      send_mouse_event("mousedown", 0, 0);
      expect(qml.pressed).toBe(true);
      send_mouse_event("mouseup", 0, 0);
      expect(qml.pressed).toBe(false);
      send_mouse_event("mousedown", 0, 0);
      expect(qml.pressed).toBe(true);
      send_mouse_event("mouseup", 11, 11);
      expect(qml.pressed).toBe(false);
      window.onTestLoad()
    }
  }
}
