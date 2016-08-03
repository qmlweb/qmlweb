import QtQuick 2.0
/* The issue that can arise is that LocalComponentProperty ends up with the
 * same importContextId as this file, so we import "ImportFrom" qualified, so
 * that a plain "ImportMe" in LocalComponentProperty will fail if it ends up
 * within this file's context. */
import "ImportFrom" as ImportFrom

Item {
  property int value: local_component_property.count ? local_component_property.itemAt(0).value : 0
  ImportFrom.LocalComponentProperty {
    id: local_component_property
    /* Required to set model here, instead of within Repeater, as it causes the
     * Repeater's delegate to get created in this file's context, instead of
     * LocalComponentProperty's context. So if the delegate doesn't have an
     * importContextId set, it will default to this file's, which is incorrect.
     * */
    model: 1
  }
}
