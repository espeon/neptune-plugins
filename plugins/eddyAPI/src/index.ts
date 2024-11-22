import { intercept } from "@neptune";
import { Tracer } from "@inrixia/lib/trace";

import { MediaItem, MediaItemCache } from "@inrixia/lib/Caches/MediaItemCache";
import getPlaybackControl from "@inrixia/lib/getPlaybackControl";

import { updateMediaInfo, stopServer } from "./serve.native";

const trace = Tracer("[DiscordRPC]");

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

let currentInfo: MediaInfo = {
  item: null,
  position: null,
  duration: null,
  albumArt: null,
  artistArt: null,
  paused: false,
};

export const update = async (info?: UpdateInfo) => {
  trace.log("Updating media info:", info);
  if (!info) return;
  const { track, time, paused } = info;
  if (track) {
    currentInfo.item = track;
    currentInfo.albumArt =
      track.album && track.album.cover ? getMediaURL(track.album.cover) : null;
    currentInfo.artistArt =
      track.artist && track.artist.picture
        ? getMediaURL(track.artist.picture)
        : null;
    currentInfo.duration = track.duration ? track.duration : null;
  }

  if (time) {
    currentInfo.position = time;
  }

  if (paused) {
    currentInfo.paused = paused;
  }
  trace.log("Current media info:", currentInfo);
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
    if (currentInfo.paused && state === "PLAYING") update({ paused: false });
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

export const onUnload = () => {
  unloadTransition();
  unloadTime();
  unloadSeek();
  unloadPlay();
  unloadPause();
  stopServer();
};
