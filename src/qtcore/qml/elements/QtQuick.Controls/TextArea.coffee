registerQmlType
    module: 'QtQuick.Controls'
    name: 'TextArea'
    versions: /.*/
    constructor: QMLTextArea

QMLTextArea = (meta) ->

    updateValue = (e) ->
        if self.text != self.dom.firstChild.value
            self.text = self.dom.firstChild.value
        return

    QMLItem.call this, meta
    self = this
    QMLFont = new getConstructor('QtQuick', '2.0', 'Font')
    @font = new QMLFont(this)
    @dom.innerHTML = '<textarea></textarea>'
    @dom.firstChild.style.pointerEvents = 'auto'
    @dom.firstChild.style.width = '100%'
    @dom.firstChild.style.height = '100%'
    @dom.firstChild.style.margin = '0'
    createSimpleProperty 'string', this, 'text', ''
    @Component.completed.connect this, ->
        @implicitWidth = @dom.firstChild.offsetWidth
        @implicitHeight = @dom.firstChild.offsetHeight
        return
    @textChanged.connect this, (newVal) ->
        @dom.firstChild.value = newVal
        return
    @dom.firstChild.oninput = updateValue
    @dom.firstChild.onpropertychanged = updateValue
    return
