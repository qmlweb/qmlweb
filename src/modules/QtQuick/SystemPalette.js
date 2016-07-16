const platformsDetectors = [
  //{ name: 'W8',      regexp: /Windows NT 6\.2/ },
  //{ name: 'W7',      regexp: /Windows NT 6\.1/ },
  //{ name: 'Windows', regexp: /Windows NT/ },
  { name: 'OSX',     regexp: /Macintosh/ }
];

const systemPalettes = {};

registerQmlType({
  module: "QtQuick",
  name: "SystemPalette",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  enums: {
    SystemPalette: {
      Active: "active", Inactive: "inactive", Disabled: "disabled"
    }
  },
  properties: {
    alternateBase: { type: "color", readOnly: true },
    base: { type: "color", readOnly: true },
    button: { type: "color", readOnly: true },
    buttonText: { type: "color", readOnly: true },
    dark: { type: "color", readOnly: true },
    highlight: { type: "color", readOnly: true },
    highlightedText: { type: "color", readOnly: true },
    light: { type: "color", readOnly: true },
    mid: { type: "color", readOnly: true },
    midlight: { type: "color", readOnly: true },
    shadow: { type: "color", readOnly: true },
    text: { type: "color", readOnly: true },
    window: { type: "color", readOnly: true },
    windowText: { type: "color", readOnly: true },

    colorGroup: "enum"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);


    var attrs    = [ 'alternateBase', 'base', 'button', 'buttonText', 'dark', 'highlight', 'highlightedText', 'light', 'mid', 'midlight', 'shadow', 'text', 'window', 'windowText' ];
    var platform = 'OSX';

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

QmlWeb.systemPalettes = systemPalettes;
QmlWeb.platformsDetectors = platformsDetectors;
