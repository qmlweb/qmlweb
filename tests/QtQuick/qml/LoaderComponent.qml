import QtQuick 2.0
import QtWebSockets 1.0 as WS
import "LoaderDirectory" as LD
import "LoaderDirectory"

Item {
  property int value: 42

  WS.WebSocket {}
  LoaderDirectoryComponent {}
  LD.LoaderDirectoryComponent {}
}
