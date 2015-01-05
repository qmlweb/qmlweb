window.SystemPalette = {
  Active:   "active",
  Inactive: "inactive",
  Disabled: "disabled"
};

registerQmlType({
  module: 'QtQuick',
  name: 'SystemPalette',
  versions: /.*/,
  constructor: function QMLSystemPalette(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("enum", this, "colorGroup");

    var attrs = [ 'alternateBase', 'base', 'button', 'buttonText', 'dark', 'highlight', 'highlightedText', 'light', 'mid', 'midlight', 'shadow', 'text', 'window', 'windowText' ];

    for (var i = 0 ; i < attrs.length ; ++i)
      createSimpleProperty("color", this, attrs[i], "ro");
    createSimpleProperty("enum", this, "colorGroup");

    this.colorGroupChanged.connect(this, (function (newVal) {
      this.$canEditReadOnlyProperties = true;
      for (var i = 0 ; i < attrs.length ; ++i) {
        this[attrs[i]] = colorGroups[newVal][attrs[i]];
      }
      delete this.$canEditReadOnlyProperties;
    }).bind(this));

    var colorGroups = {
      'active': {
        'alternateBase': '#f6f6f6',
        'base':          '#ffffff',
        'button':        '#ededed',
        'buttonText':    '#000000',
        'dark':          '#bfbfbf',
        'highlight':     '#fbed73',
        'highlightText': '#000000',
        'light':         '#ffffff',
        'mid':           '#a9a9a9',
        'midlight':      '#f6f6f6',
        'shadow':        '#8b8b8b',
        'text':          '#000000',
        'window':        '#ededed',
        'windowText':    '#000000'
      },
      'inactive': {
        'alternateBase': '#f6f6f6',
        'base':          '#ffffff',
        'button':        '#ededed',
        'buttonText':    '#000000',
        'dark':          '#bfbfbf',
        'highlight':     '#fbed73',
        'highlightText': '#000000',
        'light':         '#ffffff',
        'mid':           '#a9a9a9',
        'midlight':      '#f6f6f6',
        'shadow':        '#8b8b8b',
        'text':          '#000000',
        'window':        '#ededed',
        'windowText':    '#000000'
      },
      'disabled': {
        'alternateBase': '#f6f6f6',
        'base':          '#ffffff',
        'button':        '#ededed',
        'buttonText':    '#000000',
        'dark':          '#bfbfbf',
        'highlight':     '#fbed73',
        'highlightText': '#000000',
        'light':         '#ffffff',
        'mid':           '#a9a9a9',
        'midlight':      '#f6f6f6',
        'shadow':        '#8b8b8b',
        'text':          '#000000',
        'window':        '#ededed',
        'windowText':    '#000000'
      }
    };
  }
});
