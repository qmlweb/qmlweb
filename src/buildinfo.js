/*
 * Build information file.
 * To be overwritten for builds by util/publish.
 */

QMLWEB_BUILDINFO = {
    // Base commit hash for build.
    // "git" when not built
    hash: "git",
    // Timestamp of build, in seconds since epoch
    timestamp: Math.floor((new Date).getTime() / 1000)
};
