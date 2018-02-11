// eslint-disable-next-line no-undef
class QtMultimedia_Video extends QtQuick_Item {
  static versions = /^5\./;
  static enums = {
    MediaPlayer: {
      Available: 0, Busy: 2, Unavailable: 1, ResourceMissing: 3,

      NoError: 0, ResourceError: 1, FormatError: 2, NetworkError: 4,
      AccessDenied: 8, ServiceMissing: 16,

      StoppedState: 0, PlayingState: 1, PausedState: 2,

      NoMedia: 0, Loading: 1, Loaded: 2, Buffering: 4, Stalled: 8,
      EndOfMedia: 16, InvalidMedia: 32, UnknownStatus: 64
    },
    VideoOutput: { PreserveAspectFit: 0, PreserveAspectCrop: 1, Stretch: 2 }
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
    fillMode: "enum", // VideoOutput.PreserveAspectFit
    hasAudio: "bool",
    hasVideo: "bool",
    muted: "bool",
    orientation: "int",
    playbackRate: { type: "real", initialValue: 1 },
    playbackState: "enum", // MediaPlayer.StoppedState
    position: "int",
    seekable: "bool",
    source: "url",
    status: "enum", // MediaPlayer.NoMedia
    volume: "real"
  };
  static signals = {
    paused: [],
    playing: [],
    stopped: []
  };

  constructor(meta) {
    super(meta);

    this.$runningEventListener = 0;

    this.impl = document.createElement("video");
    this.impl.style.width = this.impl.style.height = "100%";
    this.impl.style.margin = "0";
    this.dom.appendChild(this.impl);

    this.volume = this.impl.volume;
    this.duration = this.impl.duration;

    this.impl.addEventListener("play", () => {
      this.playing();
      this.playbackState = this.MediaPlayer.PlayingState;
    });

    this.impl.addEventListener("pause", () => {
      this.paused();
      this.playbackState = this.MediaPlayer.PausedState;
    });

    this.impl.addEventListener("timeupdate", () => {
      this.$runningEventListener++;
      this.position = this.impl.currentTime * 1000;
      this.$runningEventListener--;
    });

    this.impl.addEventListener("ended", () => {
      this.stopped();
      this.playbackState = this.MediaPlayer.StoppedState;
    });

    this.impl.addEventListener("progress", () => {
      if (this.impl.buffered.length > 0) {
        this.progress = this.impl.buffered.end(0) / this.impl.duration;
        this.status = this.progress < 1 ?
          this.MediaPlayer.Buffering :
          this.MediaPlayer.Buffered;
      }
    });

    this.impl.addEventListener("stalled", () => {
      this.status = this.MediaPlayer.Stalled;
    });

    this.impl.addEventListener("canplaythrough", () => {
      this.status = this.MediaPlayer.Buffered;
    });

    this.impl.addEventListener("loadstart", () => {
      this.status = this.MediaPlayer.Loading;
    });

    this.impl.addEventListener("durationchanged", () => {
      this.duration = this.impl.duration;
    });

    this.impl.addEventListener("volumechanged", () => {
      this.$runningEventListener++;
      this.volume = this.impl.volume;
      this.$runningEventListener--;
    });

    this.impl.addEventListener("suspend", () => {
      this.error |= this.MediaPlayer.NetworkError;
    });

    this.impl.addEventListener("error", () => {
      this.error |= this.MediaPlayer.ResourceError;
    });

    this.impl.addEventListener("ratechange", () => {
      this.$runningEventListener++;
      this.playbackRate = this.impl.playbackRate;
      this.$runningEventListener--;
    });

    this.autoPlayChanged.connect(this, this.$onAutoPlayChanged);
    this.sourceChanged.connect(this, this.$onSourceChanged);
    this.positionChanged.connect(this, this.$onPositionChanged);
    this.volumeChanged.connect(this, this.$onVolumeChanged);
    this.playbackRateChanged.connect(this, this.$onPlaybackRateChanged);
    this.mutedChanged.connect(this, this.$onMutedChanged);
    this.fillModeChanged.connect(this, this.$onFillModeChanged);
  }
  $onAutoPlayChanged(newVal) {
    this.impl.autoplay = newVal;
  }
  $onSourceChanged(source) {
    const parts = source.split(".");
    const extension = parts[parts.length - 1].toLowerCase();
    const mime = this.mimetypeFromExtension(extension);
    this.impl.src = source;
    if (!this.impl.canPlayType(mime)) {
      this.error |= this.MediaPlayer.FormatError;
    }
  }
  $onPositionChanged(currentTime) {
    if (this.$runningEventListener > 0) return;
    this.impl.currentTime = currentTime / 1000;
  }
  $onVolumeChanged(volume) {
    if (this.$runningEventListener > 0) return;
    this.impl.volume = volume;
  }
  $onPlaybackRateChanged(playbackRate) {
    if (this.$runningEventListener > 0) return;
    this.impl.playbackRate = playbackRate;
  }
  $onMutedChanged(newValue) {
    if (newValue) {
      this.$volulmeBackup = this.impl.volume;
      this.volume = 0;
    } else {
      this.volume = this.$volumeBackup;
    }
  }
  $onFillModeChanged(newValue) {
    switch (newValue) {
      case this.VideoOutput.Stretch:
        this.impl.style.objectFit = "fill";
        break;
      case this.VideoOutput.PreserveAspectFit:
        this.impl.style.objectFit = "";
        break;
      case this.VideoOutput.PreserveAspectCrop:
        this.impl.style.objectFit = "cover";
        break;
    }
  }
  pause() {
    this.impl.pause();
  }
  play() {
    this.impl.play();
  }
  seek(offset) {
    this.impl.currentTime = offset * 1000;
  }
  stop() {
  }
  mimetypeFromExtension(extension) {
    const mimetypes = {
      ogg: "video/ogg",
      ogv: "video/ogg",
      ogm: "video/ogg",
      mp4: "video/mp4",
      webm: "video/webm"
    };
    return mimetypes[extension] || "";
  }
}
