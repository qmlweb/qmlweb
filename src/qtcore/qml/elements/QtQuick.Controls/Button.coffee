registerQmlType
    module: 'QtQuick.Controls'
    name: 'Button'
    versions: /.*/
    constructor: QMLButton

QMLButton = (meta) ->
    @dom = document.createElement('button')
    QMLItem.call this, meta
    self = this
    @dom.style.pointerEvents = 'auto'
    @dom.innerHTML = '<span></span>'
    createSimpleProperty 'string', this, 'text'
    @clicked = Signal()
    @Component.completed.connect this, ->
        @implicitWidth = @dom.firstChild.offsetWidth + 20
        @implicitHeight = @dom.firstChild.offsetHeight + 5
        return
    @textChanged.connect this, (newVal) ->
        @dom.firstChild.innerHTML = newVal
        #TODO: Replace those statically sized borders
        @implicitWidth = @dom.firstChild.offsetWidth + 20
        @implicitHeight = @dom.firstChild.offsetHeight + 5
        return

    @dom.onclick = (e) ->
        self.clicked()
        return

    return
