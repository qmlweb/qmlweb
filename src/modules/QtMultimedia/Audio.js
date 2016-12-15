QmlWeb.registerQmlType({
  module: "QtMultimedia",
  name: "Audio",
  versions: /^5\./,
  baseClass: "QtQml.QtObject",
  enums: {
    Audio: {
      Available: 0, Busy: 2, Unavailable: 1, ResourceMissing: 3,

      NoError: 0, ResourceError: 1, FormatError: 2, NetworkError: 4,
      AccessDenied: 8, ServiceMissing: 16,

      StoppedState: 0, PlayingState: 1, PausedState: 2,

      NoMedia: 0, Loading: 1, Loaded: 2, Buffering: 4, Stalled: 8,
      EndOfMedia: 16, InvalidMedia: 32, UnknownStatus: 64
    }
  },
  properties: {
    audioRole: "enum", // TODO
    autoLoad: { type: "bool", initialValue: true },
    autoPlay: "bool",
    availability: "enum", // Audio.Available
    duration: "int",
    error: "enum", // Audio.NoError
    errorString: "string",
    hasAudio: "bool",
    hasVideo: "bool",
    loops: { type: "int", initialValue: 1 },
    mediaObject: "var",
    // TODO: metaData
    muted: "bool",
    playbackRate: { type: "real", initialValue: 1 },
    playbackState: "enum", // Audio.StoppedState
    playlinst: "Playlist",
    position: "int",
    seekable: "bool",
    source: "url",
    status: "enum", // Audio.NoMedia
    volume: { type: "real", initialValue: 1 }
  },
  signals: {
    error: [
      { type: "enum", name: "error" },
      { type: "string", name: "errorString" }
    ],
    paused: [],
    playing: [],
    stopped: []
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO
  }
  pause() {
    // TODO
  }
  play() {
    // TODO
  }
  seek(/* offset */) {
    // TODO
  }
  stop() {
    // TODO
  }
  supportedAudioRoles() {
    // TODO
  }
});
