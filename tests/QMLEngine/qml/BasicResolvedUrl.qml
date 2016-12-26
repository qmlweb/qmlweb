import QtQuick 2.0

Item {
  property var current: Qt.resolvedUrl('.')
  property var inner1: Qt.resolvedUrl('foo/bar')
  property var inner2: Qt.resolvedUrl('foo/bar/')
  property var inner3: Qt.resolvedUrl('foo//bar/../foo////bar/./../lol/x../..s/../..')
  property var outer: Qt.resolvedUrl('../..')
  property var full: Qt.resolvedUrl('http://example.com/bar')
  property var absolute: Qt.resolvedUrl('/foo/bar')
  property var aboutBlank: Qt.resolvedUrl("about:blank")
}
