# Tidbits culled from Digia's Qt documentation

---

## Basic QML language types

 + bool            Binary true/false value
 + double          Number with a decimal point, stored in double precision
 + enumeration     Named enumeration value
 + int             Whole number, e.g. 0, 10, or -20
 + list            List of QML objects
 + real            Number with a decimal point
 + string          Free form text string
 + url             Resource locator
 + var             Generic property type

## Basic QML module types

 + color           ARGB color value. The type refers to an ARGB color value. It can be specified in a number of ways:
 + date            Date value
 + font            Font value with the properties of QFont. The type refers to a font value with the properties of QFont
 + matrix4x4       A matrix4x4 type is a 4-row and 4-column matrix
 + point           Value with x and y attributes
 + quaternion      A quaternion type has scalar, x, y, and z attributes
 + rect            Value with x, y, width and height attributes
 + size            Value with width and height attributes
 + vector2d        A vector2d type has x and y attributes
 + vector3d        Value with x, y, and z attributes
 + vector4d        A vector4d type has x, y, z and w attributes

## Type correspondences in QMLWeb

 + int		    QMLInteger
 + real		    Number
 + double	    Number
 + string	    String
 + bool		    Boolean
 + list		    QMLList
 + color	    QMLColor
 + enum		    Number
 + url		    String
 + variant	    QMLVariant
 + 'var'	    QMLVariant
 + QMLDocument  QMLComponent

---

## Items defined in QtQuick.Controls

 + Action              Abstract user interface action that can be bound to items
 + ApplicationWindow   Provides a top-level application window
 + BusyIndicator       A busy indicator
 + Button              A push button with a text label
 + Calendar            Provides a way to select dates from a calendar
 + CheckBox            A checkbox with a text label
 + ComboBox            Provides a drop-down list functionality
 + ExclusiveGroup      Way to declare several checkable controls as mutually exclusive
 + GroupBox            Group box frame with a title
 + Label               A text label
 + Menu                Provides a menu component for use as a context menu, popup menu, or as part of a menu bar
 + MenuBar             Provides a horizontal menu bar
 + MenuItem            Item to add in a menu or a menu bar
 + MenuSeparator       Separator for items inside a menu
 + ProgressBar         A progress indicator
 + RadioButton         A radio button with a text label
 + ScrollView          Provides a scrolling view within another Item
 + Slider              Provides a vertical or horizontal slider control
 + SpinBox             Provides a spin box control
 + SplitView           Lays out items with a draggable splitter between each item
 + Stack               Provides attached properties for items pushed onto a StackView
 + StackView           Provides a stack-based navigation model
 + StackViewDelegate   A delegate used by StackView for loading transitions
 + StatusBar           Contains status information in your app
 + Switch              A switch
 + Tab                 Represents the content of a tab in a TabView
 + TabView             A control that allows the user to select one of multiple stacked items
 + TableView           Provides a list view with scroll bars, styling and header sections
 + TableViewColumn     Used to define columns in a TableView or in a TreeView
 + TextArea            Displays multiple lines of editable formatted text
 + TextField           Displays a single line of editable plain text
 + ToolBar             Contains ToolButton and related controls
 + ToolButton          Provides a button type that is typically used within a ToolBar
 + TreeView            Provides a tree view with scroll bars, styling and header sections


___

### anchors group

 + anchors.top : AnchorLine
 + anchors.bottom : AnchorLine
 + anchors.left : AnchorLine
 + anchors.right : AnchorLine
 + anchors.horizontalCenter : AnchorLine
 + anchors.verticalCenter : AnchorLine
 + anchors.baseline : AnchorLine
 + anchors.fill : Item
 + anchors.centerIn : Item
 + anchors.margins : real
 + anchors.topMargin : real
 + anchors.bottomMargin : real
 + anchors.leftMargin : real
 + anchors.rightMargin : real
 + anchors.horizontalCenterOffset : real
 + anchors.verticalCenterOffset : real
 + anchors.baselineOffset : real
 + anchors.alignWhenCentered : bool

### animation types

 + Animation (base type)
 + AnchorAnimation
 + ParallelAnimation
 + ParentAnimation
 + PathAnimation
 + PauseAnimation
 + PropertyAction
 + PropertyAnimation
 + ScriptAction
 + SequentialAnimation
