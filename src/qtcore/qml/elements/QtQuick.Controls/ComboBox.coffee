registerQmlType
    module: 'QtQuick'
    name: 'ComboBox'
    versions: /.*/
    constructor: QMLComboBox

QMLComboBox = (meta) ->
    QMLItem.call this, meta
    self = this
    @dom.style.pointerEvents = 'auto'
    @name = 'QMLComboBox'
    createSimpleProperty 'int', this, 'count'
    createSimpleProperty 'int', this, 'currentIndex'
    createSimpleProperty 'string', this, 'currentText'
    createSimpleProperty 'array', this, 'menu'
    createSimpleProperty 'array', this, 'model'
    createSimpleProperty 'bool', this, 'pressed'
    @count = 0
    @currentIndex = 0
    @currentText = ''
    @menu = []
    @model = []
    @pressed = false

    updateCB = ->
        head = '<select>'
        tail = '</select>'
        html = head
        model = self.model
        count = model.length
        self.count = count
        i = 0
        while i < count
            elt = model[i]
            #if (elt instanceof Array) { // TODO - optgroups? update model !
            #    var count_i = elt.length;
            #    for (var j = 0; j < count_i; j++)
            #        html += "<option>" + elt[j] + "</option>";
            #}
            #else
            html += '<option>' + elt + '</option>'
            i++
        html += tail
        html

    @accepted = Signal()
    @activated = Signal([ {
        type: 'int'
        name: 'index'
    } ])

    @find = (text) ->
        self.model.indexOf text

    @selectAll = ->

    # TODO

    @textAt = (index) ->
        @model[index]

    @Component.completed.connect this, ->
        @dom.innerHTML = updateCB()
        child = @dom.firstChild
        @implicitWidth = child.offsetWidth
        @implicitHeight = child.offsetHeight
        return
    @modelChanged.connect updateCB

    @dom.onclick = (e) ->
        index = self.dom.firstChild.selectedIndex
        self.currentIndex = index
        self.currentText = self.model[index]
        self.accepted()
        self.activated index
        return

    return
