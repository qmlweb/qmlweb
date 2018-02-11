// eslint-disable-next-line no-undef
class QtMultimedia_MediaPlayer extends QtQml_QtObject {
  static versions = /^5\./;
  static enums = {
    MediaPlayer: {
      Available: 0, Busy: 2, Unavailable: 1, ResourceMissing: 3,

      NoError: 0, ResourceError: 1, FormatError: 2, NetworkError: 4,
      AccessDenied: 8, ServiceMissing: 16,

      StoppedState: 0, PlayingState: 1, PausedState: 2,

      NoMedia: 0, Loading: 1, Loaded: 2, Buffering: 4, Stalled: 8,
      EndOfMedia: 16, InvalidMedia: 32, UnknownStatus: 64
    }
  };
  static properties = {
    audioRole: "enum", // TODO
    autoLoad: { type: "bool", initialValue: true },
    autoPlay: "bool",
    availability: "enum", // MediaPlayer.Available
    bufferProgress: "real",
    duration: "int",
    error: "enum", // MediaPlayer.NoError
    errorString: "string",
    hasAudio: "bool",
    hasVideo: "bool",
    loops: "int",
    muted: "bool",
    playbackRate: { type: "real", initialValue: 1 },
    playbackState: "enum", // MediaPlayer.StoppedState
    position: "int",
    seekable: "bool",
    source: "url",
    status: "enum", // MediaPlayer.NoMedia
    volume: "real"
  };
  static signals = {
    error: [
      { type: "enum", name: "error" },
      { type: "string", name: "errorString" }
    ],
    paused: [],
    playing: [],
    stopped: []
  };

  // TODO: impl
}
