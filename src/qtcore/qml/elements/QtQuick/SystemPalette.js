var SystemPalette = {
  Active:   "active",
  Inactive: "inactive",
  Disabled: "disabled"
};

var platformsDetectors = [
  //{ name: 'W8',      regexp: /Windows NT 6\.2/ },
  //{ name: 'W7',      regexp: /Windows NT 6\.1/ },
  //{ name: 'Windows', regexp: /Windows NT/ },
  { name: 'OSX',     regexp: /Macintosh/ }
];

var systemPalettes = {};

registerQmlType({
  module: 'QtQuick',
  name: 'SystemPalette',
  versions: /.*/,
  constructor: function QMLSystemPalette(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("enum", this, "colorGroup");

    var attrs    = [ 'alternateBase', 'base', 'button', 'buttonText', 'dark', 'highlight', 'highlightedText', 'light', 'mid', 'midlight', 'shadow', 'text', 'window', 'windowText' ];
    var platform = 'OSX';

    for (var i = 0 ; i < attrs.length ; ++i)
      createSimpleProperty("color", this, attrs[i], "ro");
    createSimpleProperty("enum", this, "colorGroup");

    this.colorGroupChanged.connect(this, (function (newVal) {
      this.$canEditReadOnlyProperties = true;
      for (var i = 0 ; i < attrs.length ; ++i) {
        this[attrs[i]] = systemPalettes[platform][newVal][attrs[i]];
      }
      delete this.$canEditReadOnlyProperties;
    }).bind(this));

    // Detect OS
    for (var i = 0 ; i < platformsDetectors.length ; ++i) {
      if (platformsDetectors[i].regexp.test(navigator.userAgent)) {
        platforms = platformsDetectors[i].name;
        break ;
      }
    }
  }
});

systemPalettes['OSX'] = {
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
          'highlight':     '#d0d0d0',
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
          'base':          '#ededed',
          'button':        '#ededed',
          'buttonText':    '#949494',
          'dark':          '#bfbfbf',
          'highlight':     '#d0d0d0',
          'highlightText': '#7f7f7f',
          'light':         '#ffffff',
          'mid':           '#a9a9a9',
          'midlight':      '#f6f6f6',
          'shadow':        '#8b8b8b',
          'text':          '#7f7f7f',
          'window':        '#ededed',
          'windowText':    '#7f7f7f'
        }
};
