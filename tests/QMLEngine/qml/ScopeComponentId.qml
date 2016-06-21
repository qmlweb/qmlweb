import QtQuick 2.0

ScopeComponentIdSomeComponent {
  id: some_component

  property int foo: 42
  property int bar: some_component.foo
}
