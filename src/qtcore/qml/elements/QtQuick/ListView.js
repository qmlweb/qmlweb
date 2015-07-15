registerQmlType({
    module: 'QtQuick',
    name: 'ListView',
    versions: /.*/,
    constructor: function QMLListView(meta) {
        var self = this;
        var QMLRepeater = getConstructor('QtQuick', '2.0', 'Repeater');
        QMLRepeater.call(this, meta);

        createSimpleProperty("enum", this, "orientation");
        createSimpleProperty("real", this, "spacing");

        this.container = function () {
            return self;
        }
        this.modelChanged.connect(styleChanged);
        this.delegateChanged.connect(styleChanged);
        this.orientationChanged.connect(styleChanged);
        this.spacingChanged.connect(styleChanged);

        this._childrenInserted.connect(applyStyleOnItem)

        function applyStyleOnItem($item) {
            $item.dom.style.position = 'initial';
            if (self.orientation == Qt.Horizontal) {
                $item.dom.style.display = 'inline-block';
                if ($item != self.$items[0])
                    $item.dom.style["margin-left"] = self.spacing + "px";
            } else {
                $item.dom.style.display = 'block';
                if ($item != self.$items[0])
                    $item.dom.style["margin-top"] = self.spacing + "px";
            }
        }

        function styleChanged() {
            for (var i = 0; i < self.$items.length; ++i) {
                applyStyleOnItem(self.$items[i]);
            }
        }
    }
});
