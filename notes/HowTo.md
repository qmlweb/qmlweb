# How to use QMLWeb

#

## Hints

These hints are meant to provide some useful tips,
based on experience gained when writing the test
examples. 

#

### 1 Choosing QML file names

When naming a QML file, you may choose an arbitrary name
for as long as you do not intend to include in another
QML file.

If you plan to include a QML file in another QML file,
make sure that you do not name it after an existing QML
type. For instance do not call the file Rectangle.qml.
If you do so and include it in another file, it interferes
with the standard QML item Rectangle.

### 2 Items and identifiers

For the same reason as in choosing QML file names, if you
give an ID to an item, make sure that it is unique within
your QML file including other included QML file.

Just as element IDs have to be globally unique in an HTML,
QML ids also need to be globally unique within their usage
context. For instance, assume you have two files A.qml and
B.QML and include them in C.qml. If A.qml has an Item with
id itemID and B.qml has an Item with id itemID, this will
cause problems in C.qml, even if A.qmland B.qml by themselves
will work fine.

##### 2.1 Problem Example

 + **A.qml**
#
    import QtQuick2.0
    Rectangle {
        id: itemID
    }
#
 + **B.qml**
#
    import QtQuick2.0
    Rectangle {
        id: itemID
    }
#
 + **C.qml**
#
    import QtQuick2.0
    Rectangle {
        A {}
        B {}
    }
#

##### 2.2 Correct Example

 + **A.qml**
#
    import QtQuick2.0
    Rectangle {
        id: itemID_A
    }
#
 + **B.qml**
#
    import QtQuick2.0
    Rectangle {
        id: itemID_B
    }
#
 + **C.qml**
#
    import QtQuick2.0
    Rectangle {
        A {}
        B {}
    }
#

##### 2.3 Recommendation for IDs

**Do not give IDs to Items unless you need
to refer to them somewhere in your code.**

#
