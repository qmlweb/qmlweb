registerQmlType({
  module:   'QtQuick',
  name:     'ListView',
  versions: /.*/,
  baseClass: QMLRepeater,
  constructor: function QMLListView(meta) {
    var self = this;
    var QMLRepeater = getConstructor('QtQuick', '2.0', 'Repeater');
    QMLRepeater.call(this, meta);

    createSimpleProperty("enum", this, "orientation");
    createSimpleProperty("real", this, "spacing");
    createSimpleProperty("Component", this, "header");  // TODO: implement
    createSimpleProperty("Item", this, "headerItem");  // TODO: implement
    createSimpleProperty("enumeration", this, "headerPositioning");  // TODO: implement
    
    createSimpleProperty("Component", this, "footer");  // TODO: implement
    createSimpleProperty("Item", this, "footerItem");  // TODO: implement
    createSimpleProperty("enumeration", this, "footerPositioning");  // TODO: implement

/* TODO:
section
section.property : string
section.criteria : enumeration
section.delegate : Component
section.labelPositioning : enumeration
*/

    this.container = function() { return self; }
    this.modelChanged.connect(styleChanged);
    this.delegateChanged.connect(styleChanged);
    this.orientationChanged.connect(styleChanged);
    this.spacingChanged.connect(styleChanged);

    this._childrenInserted.connect(styleChanged)

    function applyStyleOnItem($item) {
      $item.css.position = 'initial';
      if (self.orientation == Qt.Horizontal) {
        $item.css.display = 'inline-block';
        if ($item != self.$items[0])
          $item.dom.parentElement.style["margin-left"] = self.spacing + "px";
      }
      else {
        $item.css.display = 'block';
        if ($item != self.$items[0]) {
			// $item.dom.parentElement is <li>
          $item.dom.parentElement.style["margin-top"] = self.spacing + "px";
		}
      }
    }

    function styleChanged() {
      for (var i = 0 ; i < self.$items.length ; ++i) {
        applyStyleOnItem(self.$items[i]);
      }
    }
  }
});
