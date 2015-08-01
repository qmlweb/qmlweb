###*
#
# TextField is used to accept a line of text input.
# Input constraints can be placed on a TextField item
# (for example, through a validator or inputMask).
# Setting echoMode to an appropriate value enables TextField
# to be used for a password input field.
#
# Valid entries for echoMode and alignment are defined in TextInput.
#
###

registerQmlType
    module: 'QtQuick'
    name: 'TextField'
    versions: /.*/
    constructor: QMLTextInput

QMLTextInput = (meta) ->

registerQmlType
    module: 'QtQuick'
    name: 'TextField'
    versions: /.*/
    constructor: QMLTextInput

    testValidator = ->
        if typeof self.validator != 'undefined' and self.validator != null
            return self.validator.validate(self.text)
        true

    updateValue = (e) ->
        if self.text != self.dom.firstChild.value
            self.$canEditReadOnlyProperties = true
            self.text = self.dom.firstChild.value
            self.$canEditReadOnlyProperties = false
        return

    QMLItem.call this, meta
    self = this
    @font = new getConstructor('QtQuick', '2.0', 'Font')(this)
    @dom.innerHTML = '<input type="text" disabled/>'
    @dom.firstChild.style.pointerEvents = 'auto'
    @dom.firstChild.style.margin = '0'
    @dom.firstChild.style.width = '100%'
    @setupFocusOnDom @dom.firstChild
    createSimpleProperty 'string', this, 'text'
    createSimpleProperty 'int', this, 'maximumLength'
    createSimpleProperty 'bool', this, 'readOnly'
    createSimpleProperty 'var', this, 'validator'
    createSimpleProperty 'enum', this, 'echoMode'
    @accepted = Signal()
    @readOnly = false
    @maximumLength = -1
    @dom.firstChild.disabled = false
    @Component.completed.connect this, ->
        @implicitWidth = @dom.firstChild.offsetWidth
        @implicitHeight = @dom.firstChild.offsetHeight
        return
    @textChanged.connect this, (newVal) ->
        @dom.firstChild.value = newVal
        return
    @echoModeChanged.connect this, ((newVal) ->
        switch newVal
            when TextField.Normal
                @dom.firstChild.type = 'text'
            when TextField.Password
                @dom.firstChild.type = 'password'
        return
    ).bind(this)
    @maximumLengthChanged.connect this, (newVal) ->
        if newVal < 0
            newVal = null
        @dom.firstChild.maxLength = newVal
        return
    @readOnlyChanged.connect this, (newVal) ->
        @dom.firstChild.disabled = newVal
        return
    @Keys.pressed.connect this, ((e) ->
        if (e.key == Qt.Key_Return or e.key == Qt.Key_Enter) and testValidator()
            self.accepted()
            e.accepted = true
        return
    ).bind(this)
    @dom.firstChild.oninput = updateValue
    @dom.firstChild.onpropertychanged = updateValue
    return
