import { useCallback, useEffect, useRef, useState } from 'react';
import type Hls from 'hls.js';
import type { VideoQuality } from '@/types/index';
import { getLessonPlayback, PlaybackError } from '@/lib/data-access';

/**
 * The lesson player's media engine: signed playback, quality pinning, and
 * token refresh.
 *
 * Three things here are load-bearing and none of them are obvious.
 *
 * **Quality is pinned, never automatic.** hls.js defaults to adaptive bitrate,
 * which on a fast connection climbs to the highest rendition available. Thirteen
 * two-hour lessons at 1080p is tens of gigabytes on Nigerian mobile data — a
 * real fraction of what the student paid for the course, spent on bandwidth
 * they did not choose. So `autoLevelEnabled` is off and the level is set
 * explicitly. This is also the reason the app does not use Bunny's own iframe
 * player: its API exposes no way to set quality at all.
 *
 * **The token is refreshed mid-playback.** Playback URLs are signed with a
 * short TTL because a copied link should die quickly. A lesson runs far longer
 * than that TTL, so without refreshing, every segment starts returning 403
 * partway through — which presents as the video freezing, and gets debugged as
 * a network problem. `xhrSetup` rewrites the token on each segment request
 * instead, so the URL stays fresh without ever interrupting playback.
 *
 * **Safari has no MSE.** There, the manifest is handed to the browser directly
 * and there is no request hook to rewrite, so the server signs a longer TTL for
 * those clients instead. Quality pinning is not available on that path.
 */

/** Everything the control strip needs, and nothing about how it is rendered. */
export interface LessonPlayerState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** Student-facing. Distinguishes "not yet uploaded" from "not entitled". */
  errorMessage: string | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  /** True media duration once known, else 0. */
  duration: number;
  /** Renditions the manifest actually contains, in config order. */
  availableQualities: VideoQuality[];
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
}

interface Options {
  lessonId: string;
  /** Skip all network work for a lesson the student cannot open. */
  isLocked: boolean;
  /** Applied to the manifest as an explicit level. Never "auto". */
  quality: VideoQuality;
  /** Where to resume. Applied once, on metadata. */
  resumeAtSeconds: number;
  /** Re-sign this long before expiry, so a slow request cannot lose the race. */
  refreshLeadSeconds?: number;
}

const DEFAULT_REFRESH_LEAD_SECONDS = 60;

/** "720p" -> 720. The config speaks in labels; hls.js speaks in heights. */
function qualityToHeight(quality: VideoQuality): number {
  return Number.parseInt(quality, 10);
}

/**
 * Pin playback to one rendition.
 *
 * Assigning `currentLevel` is what turns adaptive bitrate off — `autoLevelEnabled`
 * is a read-only getter that simply reports whether `currentLevel` is -1. Setting
 * a concrete index is therefore both the level change and the ABR kill switch,
 * and there is no separate flag to forget.
 */
function applyLevel(hls: Hls, quality: VideoQuality): void {
  const wanted = qualityToHeight(quality);
  const index = hls.levels.findIndex((level) => level.height === wanted);
  // Unknown rendition: leave the current pin alone rather than falling back to
  // -1, which would silently re-enable ABR and the data cost that comes with it.
  if (index === -1) return;
  hls.currentLevel = index;
}

/**
 * Swap the `/bcdn_token=…/` path segment on an outgoing request for the
 * current one.
 *
 * Bunny directory tokens live in the path, not the query string, which is what
 * makes relative segment URLs inherit them. It also means a refreshed token has
 * to be spliced back into the path. The segment never contains a `/` — the
 * signature is base64url and `token_path` is percent-encoded — so matching up
 * to the next slash is safe.
 */
export function rewriteToken(requestUrl: string, freshSignedUrl: string): string {
  const fresh = freshSignedUrl.match(/\/bcdn_token=[^/]*/);
  if (!fresh) return requestUrl;
  return requestUrl.replace(/\/bcdn_token=[^/]*/, fresh[0]);
}

export function useLessonPlayer({
  lessonId,
  isLocked,
  quality,
  resumeAtSeconds,
  refreshLeadSeconds = DEFAULT_REFRESH_LEAD_SECONDS,
}: Options): LessonPlayerState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Read inside xhrSetup on every segment request, so it must be a ref — a
  // state value would be captured stale by the closure hls.js holds.
  const signedUrlRef = useRef<string>('');
  const resumeRef = useRef<number>(resumeAtSeconds);
  // Same reason as signedUrlRef: read from inside an hls.js callback.
  const qualityRef = useRef<VideoQuality>(quality);
  qualityRef.current = quality;

  const [status, setStatus] = useState<LessonPlayerState['status']>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [availableQualities, setAvailableQualities] = useState<VideoQuality[]>([]);

  // Only the first load should seek; a quality change must not yank the
  // student back to where they started the session.
  resumeRef.current = status === 'ready' ? resumeRef.current : resumeAtSeconds;

  useEffect(() => {
    if (isLocked || !lessonId) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let detach: (() => void) | undefined;

    setStatus('loading');
    setErrorMessage(null);

    /** Re-sign shortly before the current token expires, and reschedule. */
    const scheduleRefresh = (expiresAt: number) => {
      const msUntilRefresh = Math.max(
        5_000,
        (expiresAt - refreshLeadSeconds) * 1000 - Date.now()
      );

      refreshTimer = setTimeout(async () => {
        if (cancelled) return;
        try {
          const next = await getLessonPlayback(lessonId);
          if (cancelled) return;
          signedUrlRef.current = next.url;
          scheduleRefresh(next.expiresAt);
        } catch {
          // Retry once on the lead window rather than surfacing an error: the
          // student is mid-lesson and the current token has not expired yet.
          if (!cancelled) refreshTimer = setTimeout(() => scheduleRefresh(0), 10_000);
        }
      }, msUntilRefresh);
    };

    (async () => {
      let signed;
      try {
        signed = await getLessonPlayback(lessonId);
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(
          error instanceof PlaybackError
            ? error.message
            : 'Could not load this video. Check your connection and try again.'
        );
        return;
      }

      if (cancelled) return;
      signedUrlRef.current = signed.url;
      if (signed.durationSeconds) setDuration(signed.durationSeconds);
      scheduleRefresh(signed.expiresAt);

      const video = videoRef.current;
      if (!video) return;

      const onTimeUpdate = () => setCurrentTime(video.currentTime);
      const onDuration = () => {
        if (Number.isFinite(video.duration)) setDuration(video.duration);
      };
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onWaiting = () => setIsBuffering(true);
      const onPlaying = () => setIsBuffering(false);
      const onLoadedMetadata = () => {
        onDuration();
        // Resume. Guard against a stored position at or past the end, which
        // would drop the student on a finished video with nothing to play.
        const target = resumeRef.current;
        if (target > 0 && Number.isFinite(video.duration) && target < video.duration - 5) {
          video.currentTime = target;
        }
        setStatus('ready');
      };

      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('durationchange', onDuration);
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('waiting', onWaiting);
      video.addEventListener('playing', onPlaying);

      detach = () => {
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('durationchange', onDuration);
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('playing', onPlaying);
      };

      // Loaded on demand, and only the light build: the landing page must not
      // pay for the player's bundle. This is the app's largest dependency.
      const { default: HlsCtor } = await import('hls.js/light');
      if (cancelled) return;

      if (!HlsCtor.isSupported()) {
        // Safari / iOS: native HLS. No level control and no request hook, so
        // the server has already signed a TTL long enough to cover the lesson.
        video.src = signed.url;
        return;
      }

      const hls = new HlsCtor({
        // Start at the smallest rendition rather than letting ABR choose the
        // first one. The level is pinned a moment later on MANIFEST_PARSED,
        // and this way the one fragment fetched in between is the cheapest
        // rather than whatever the connection looked fast enough for.
        startLevel: 0,
        capLevelToPlayerSize: false,
        xhrSetup: (xhr: XMLHttpRequest, url: string) => {
          const fresh = rewriteToken(url, signedUrlRef.current);
          if (fresh !== url) xhr.open('GET', fresh, true);
        },
      });
      hlsRef.current = hls;

      hls.on(HlsCtor.Events.MANIFEST_PARSED, () => {
        // Report only the renditions this manifest really has, so the picker
        // never offers a quality that would silently fall back to another.
        const heights = new Set(hls.levels.map((level) => level.height));
        setAvailableQualities(
          (['360p', '480p', '720p', '1080p'] as VideoQuality[]).filter((q) =>
            heights.has(qualityToHeight(q))
          )
        );
        // Pin immediately. Read through the ref, not the closure: the student
        // may have toggled Data Saver while the manifest was still loading.
        applyLevel(hls, qualityRef.current);
      });

      hls.on(HlsCtor.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        // A 403 here almost always means the token expired faster than the
        // refresh timer — say something recoverable rather than "error 403".
        setStatus('error');
        setErrorMessage('Playback stopped. Reload the page to continue.');
      });

      hls.loadSource(signed.url);
      hls.attachMedia(video);
    })();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      detach?.();
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [lessonId, isLocked, refreshLeadSeconds]);

  // Quality changes are applied to the live instance rather than by reloading,
  // so switching does not cost the student their position or a re-buffer from
  // the start.
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls || hls.levels.length === 0) return;

    applyLevel(hls, quality);
  }, [quality, availableQualities]);

  const play = useCallback(() => {
    videoRef.current?.play().catch(() => {
      // Autoplay policies reject a play() the student did not initiate. The
      // control strip already shows the paused state, so there is nothing to
      // report.
    });
  }, []);

  const pause = useCallback(() => videoRef.current?.pause(), []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) play();
    else video.pause();
  }, [play]);

  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  return {
    videoRef,
    status,
    errorMessage,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    availableQualities,
    play,
    pause,
    togglePlay,
    seek,
  };
}
