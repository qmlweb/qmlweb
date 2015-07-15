registerQmlType({
    module: 'QtQuick',
    name: 'TestPlugin',
    versions: /.*/,
    constructor: function(meta) {
        QMLItem.call(this, meta);

        var self = this;

        // Managing properties
        createSimpleProperty('string', this, 'name');
        createSimpleProperty('var', this, 'data');
        this.name = 'default name';
        this.data = ['###', 2, 'three', 4, '###'];

        // Signals
        this.testPluginSignal = Signal();

        // Using the DOM
        function updateText() {
            var text = '[';
            for (var i = 0; i < self.data.length; ++i)
                text += ' ' + self.data[i];
            text += ' ]';
            self.dom.textContent = text;
        }

        updateText();
    }
});
