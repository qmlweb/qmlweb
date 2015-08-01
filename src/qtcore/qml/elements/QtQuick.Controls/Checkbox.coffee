
registerQmlType
    module: 'QtQuick.Controls'
    name: 'CheckBox'
    versions: /.*/
    constructor: QMLCheckbox

QMLCheckbox = (meta) ->
    @dom = document.createElement('label')
    QMLItem.call this, meta
    self = this
    QMLFont = new getConstructor('QtQuick', '2.0', 'Font')
    @font = new getConstructor('QtQuick', '2.0', 'Font')(this)
    @dom.innerHTML = '<input type="checkbox"><span></span>'
    @dom.style.pointerEvents = 'auto'
    @dom.firstChild.style.verticalAlign = 'text-bottom'
    createSimpleProperty 'string', this, 'text'
    createSimpleProperty 'bool', this, 'checked'
    createSimpleProperty 'color', this, 'color'
    @Component.completed.connect this, ->
        @implicitHeight = @dom.offsetHeight
        @implicitWidth = @dom.offsetWidth
        return
    @textChanged.connect this, (newVal) ->
        @dom.children[1].innerHTML = newVal
        @implicitHeight = @dom.offsetHeight
        @implicitWidth = @dom.offsetWidth
        return
    @colorChanged.connect this, (newVal) ->
        @dom.children[1].style.color = newVal
        return

    @dom.firstChild.onchange = ->
        self.checked = @checked
        return

    return
