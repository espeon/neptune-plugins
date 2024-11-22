import { intercept } from "@neptune";
import { Tracer } from "@inrixia/lib/trace";

import { settings } from "./Settings";

export { Settings } from "./Settings";

import { MediaItem, MediaItemCache } from "@inrixia/lib/Caches/MediaItemCache";
import getPlaybackControl from "@inrixia/lib/getPlaybackControl";

import { updateMediaInfo, stopServer, startServer } from "./serve.native";

const trace = Tracer("[EddyAPI]");

interface MediaInfo {
  /// the current track
  item: MediaItem | null;
  /// the playhead position in seconds
  position: number | null;
  /// the duration of the current track in seconds
  duration: number | null;
  /// an art URL for the current track's album
  albumArt: string | null;
  /// an art URL for the current track's artist
  artistArt: string | null;
  /// is the player paused
  paused: boolean;
  lastUpdate: number;
}

interface UpdateInfo {
  track?: MediaItem;
  time?: number;
  paused?: boolean;
}

const getMediaURL = (id?: string, path = "/1280x1280.jpg") =>
  id
    ? "https://resources.tidal.com/images/" + id.split("-").join("/") + path
    : null;

let currentInfo: MediaInfo | null = null;

export const update = async (info?: UpdateInfo) => {
  trace.debug("Updating media info:", info);

  if (!info) return;

  if (!currentInfo)
    currentInfo = {
      item: null,
      position: null,
      duration: null,
      albumArt: null,
      artistArt: null,
      paused: false,
      lastUpdate: Date.now(),
    };

  const { track, time, paused } = info;
  if (track) {
    currentInfo.item = track;
    currentInfo.albumArt =
      track.album && track.album.cover ? getMediaURL(track.album.cover) : null;
    currentInfo.artistArt =
      track.artist && track.artist.picture
        ? getMediaURL(track.artist.picture, "/320x320.jpg")
        : null;
    currentInfo.duration = track.duration ? track.duration : null;
  }

  if (time) {
    currentInfo.position = time;
    currentInfo.lastUpdate = Date.now();
  }

  // oops! forgot that paused can be falsy :)
  if (paused !== undefined) {
    currentInfo.paused = paused;
  }
  updateMediaInfo(currentInfo);
};

const unloadTransition = intercept(
  "playbackControls/MEDIA_PRODUCT_TRANSITION",
  ([media]) => {
    const mediaProduct = media.mediaProduct as { productId: string };
    MediaItemCache.ensure(mediaProduct.productId)
      .then((track) => {
        if (track) update({ track, time: 0 });
      })
      .catch(trace.err.withContext("Failed to fetch media item"));
  },
);

const unloadTime = intercept("playbackControls/TIME_UPDATE", ([newTime]) => {
  if (typeof newTime === "number") update({ time: newTime });
});
const unloadSeek = intercept("playbackControls/SEEK", ([newTime]) => {
  if (typeof newTime === "number") update({ time: newTime });
});
const unloadPlay = intercept(
  "playbackControls/SET_PLAYBACK_STATE",
  ([state]) => {
    if (currentInfo?.paused && state === "PLAYING") update({ paused: false });
  },
);
const unloadPause = intercept("playbackControls/PAUSE", () => {
  update({ paused: true });
});

const { playbackContext, playbackState, latestCurrentTime } =
  getPlaybackControl();

update({
  track: await MediaItemCache.ensure(playbackContext?.actualProductId),
  time: latestCurrentTime,
  paused: playbackState !== "PLAYING",
});

let server: any;

export const onLoad = (s: typeof settings) => {
  trace.log("Loading EddyAPI on port " + s.eddyAPIPort);
  trace.log(
    "Secure mode " +
      (s.eddySecureAPI
        ? "enabled - check your config for the API key."
        : "disabled."),
  );
  server = startServer({
    port: s.eddyAPIPort || 3665,
    secure: s.eddySecureAPI || false,
    apiKey: s.eddySecureAPIKey,
  });
};

onLoad(settings);

export const onUnload = () => {
  unloadTransition();
  unloadTime();
  unloadSeek();
  unloadPlay();
  unloadPause();
  stopServer();
};
