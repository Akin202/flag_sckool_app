import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FlagSkoolConfig,
  Page,
  Lesson,
  Module,
  LessonResource,
  LessonComment,
  UserProfile,
  VideoQuality,
  CommentsVariant,
  ResourcesVariant,
  LessonAccessVariant,
  DataSaverVariant,
  estimateDataUsageMb,
  LoadState,
} from '@/types/index';
import {
  getLessonById,
  getModulesWithLessons,
  getLessonResources,
  getLessonComments,
  postLessonComment,
  toggleLessonCompletion,
  saveLessonPosition,
  getUserProfile,
} from '@/lib/data-access';
import { useLessonPlayer } from '@/hooks/useLessonPlayer';
import { StudentNav } from '@/components/StudentNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Download,
  FileCode,
  FileText,
  FileJson,
  Database,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Pin,
  Send,
  Wifi,
  WifiOff,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';

export interface LearnPageProps {
  config: FlagSkoolConfig;
  /** Route param. Always supplied by LearnScreen; never guessed. */
  lessonId: string;
  commentsVariant?: CommentsVariant;
  resourcesVariant?: ResourcesVariant;
  lessonAccessVariant?: LessonAccessVariant;
  dataSaverVariant?: DataSaverVariant;
  onNavigate?: (page: Page, lessonId?: string) => void;
  onOpenCheckout?: (tierId: 'recordings' | 'cohort') => void;
}

export const LearnPage: React.FC<LearnPageProps> = ({
  config,
  lessonId,
  commentsVariant,
  resourcesVariant,
  lessonAccessVariant,
  dataSaverVariant,
  onNavigate,
  onOpenCheckout,
}) => {
  // Data state
  const [loadState, setLoadState] = useState<
    LoadState<{
      lesson: Lesson;
      module: Module;
      nextLessonId: string | null;
      prevLessonId: string | null;
      isCompleted: boolean;
      isLocked: boolean;
      lastPositionSeconds: number;
    }>
  >({ status: 'loading' });

  const [modules, setModules] = useState<Module[]>([]);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [user, setUser] = useState<UserProfile | undefined>();

  // Player state. Position and playback come from the real <video> via
  // useLessonPlayer — only the student's own preferences live here.
  const [quality, setQuality] = useState<VideoQuality>(config.player?.defaultQuality || '480p');
  const [dataSaver, setDataSaver] = useState<boolean>(dataSaverVariant === 'on');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isTogglingComplete, setIsTogglingComplete] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showMobileOutline, setShowMobileOutline] = useState<boolean>(false);

  // Comments input state
  const [commentText, setCommentText] = useState<string>('');
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync DataSaver variant prop if changed by dev switcher
  useEffect(() => {
    if (dataSaverVariant) {
      const isOn = dataSaverVariant === 'on';
      setDataSaver(isOn);
      if (isOn) {
        setQuality(config.player?.dataSaverQuality || '360p');
      }
    }
  }, [dataSaverVariant, config.player?.dataSaverQuality]);

  // Load lesson, modules, resources, and comments
  useEffect(() => {
    let isMounted = true;
    setLoadState({ status: 'loading' });

    Promise.all([
      getLessonById(lessonId, lessonAccessVariant),
      getModulesWithLessons(),
      getLessonResources(lessonId, resourcesVariant),
      getLessonComments(lessonId, commentsVariant),
      getUserProfile(),
    ])
      .then(([lessonResult, modulesResult, resourcesResult, commentsResult, userResult]) => {
        if (!isMounted) return;

        if (lessonResult) {
          setLoadState({ status: 'success', data: lessonResult });
          setIsCompleted(lessonResult.isCompleted);
        } else {
          setLoadState({ status: 'error', error: 'Lesson not found' });
        }
        setModules(modulesResult);
        setResources(resourcesResult);
        setComments(commentsResult);
        setUser(userResult);
      })
      .catch((err) => {
        if (isMounted) {
          setLoadState({ status: 'error', error: err?.message || 'Failed to load lesson' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [lessonId, commentsVariant, resourcesVariant, lessonAccessVariant]);

  // Real playback. Everything below reads from this rather than from timers.
  const player = useLessonPlayer({
    lessonId,
    isLocked: loadState.status === 'success' ? loadState.data.isLocked : true,
    quality,
    resumeAtSeconds:
      loadState.status === 'success' ? loadState.data.lastPositionSeconds : 0,
  });

  const { isPlaying, currentTime: currentTimeSeconds } = player;

  /**
   * Lesson length.
   *
   * Prefer the media's own duration once the browser reports it; fall back to
   * the curriculum's `durationMinutes` before then so the control strip has a
   * scale to render against instead of collapsing to 0:00 on first paint.
   */
  const totalSeconds = useMemo(() => {
    if (player.duration > 0) return player.duration;
    if (loadState.status === 'success' && loadState.data.lesson) {
      return loadState.data.lesson.durationMinutes * 60;
    }
    return 0;
  }, [player.duration, loadState]);

  /**
   * Persist playback position.
   *
   * Completion is the product, so this is not bookkeeping — it is what makes a
   * student who watches in fragments over several days able to pick up where
   * they stopped instead of scrubbing for the spot and giving up. It is also
   * what marks a lesson complete: `saveLessonPosition` auto-completes past the
   * configured threshold, so no separate call is needed.
   *
   * Reads position from a ref rather than from state so the interval is created
   * once per lesson instead of being torn down and rebuilt on every timeupdate.
   */
  const positionRef = useRef({ current: 0, total: 0 });
  positionRef.current = { current: currentTimeSeconds, total: totalSeconds };

  useEffect(() => {
    if (loadState.status !== 'success' || loadState.data.isLocked) return;

    const lessonKey = loadState.data.lesson.id;

    const flush = () => {
      const { current, total } = positionRef.current;
      // Zero is the pre-metadata state, not a real position — writing it would
      // overwrite a good resume point with the start of the lesson.
      if (current <= 0 || total <= 0) return;
      void saveLessonPosition(lessonKey, current, total);
      if (!isCompleted && (current / total) * 100 >= config.player.markCompleteAtPercent) {
        setIsCompleted(true);
      }
    };

    const intervalId = isPlaying
      ? setInterval(flush, config.player.savePositionEverySeconds * 1000)
      : undefined;

    // Students close the tab mid-lesson; without this the last interval's worth
    // of progress is simply lost, and they resume slightly behind where they
    // actually stopped every single time.
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [loadState, isPlaying, isCompleted, config.player.savePositionEverySeconds, config.player.markCompleteAtPercent]);

  // Remaining duration in minutes for accurate data usage calculation
  const remainingMinutes = useMemo(() => {
    const remSeconds = Math.max(0, totalSeconds - currentTimeSeconds);
    return Math.ceil(remSeconds / 60);
  }, [totalSeconds, currentTimeSeconds]);

  // Live estimated data usage calculation
  const estimatedRemainingMb = useMemo(() => {
    return estimateDataUsageMb(remainingMinutes, quality);
  }, [remainingMinutes, quality]);

  // Helper to format timestamps (e.g. 2712s -> "45:12")
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle Quality switch
  const handleQualityChange = (newQuality: VideoQuality) => {
    setQuality(newQuality);
    if (newQuality !== (config.player?.dataSaverQuality || '360p')) {
      setDataSaver(false);
    }
  };

  // Handle Data Saver Toggle
  const handleDataSaverToggle = () => {
    const nextVal = !dataSaver;
    setDataSaver(nextVal);
    if (nextVal) {
      setQuality(config.player?.dataSaverQuality || '360p');
    } else {
      setQuality(config.player?.defaultQuality || '480p');
    }
  };

  // Handle Scrubber Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    player.seek(Number(e.target.value));
  };

  const togglePlay = player.togglePlay;

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Control strip auto-hide logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  };

  // Handle Mark Complete toggle
  const handleToggleComplete = async () => {
    if (loadState.status !== 'success') return;
    setIsTogglingComplete(true);
    const nextState = !isCompleted;
    try {
      await toggleLessonCompletion(loadState.data.lesson.id, nextState);
      setIsCompleted(nextState);
    } finally {
      setIsTogglingComplete(false);
    }
  };

  // Handle Post Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isPostingComment || loadState.status !== 'success') return;

    setIsPostingComment(true);
    try {
      const created = await postLessonComment(loadState.data.lesson.id, commentText, user);
      setComments((prev) => [created, ...prev]);
      setCommentText('');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Icon helper for resource file format
  const getResourceIcon = (format: string, kind: string) => {
    const fmt = format.toUpperCase();
    if (fmt === 'JSON' || kind === 'blueprint') {
      return <FileJson className="w-5 h-5 text-flag-red" />;
    }
    if (fmt === 'ZIP' || kind === 'code') {
      return <FileCode className="w-5 h-5 text-[#38BDF8]" />;
    }
    if (fmt === 'JSONL' || kind === 'dataset') {
      return <Database className="w-5 h-5 text-[#F59E0B]" />;
    }
    return <FileText className="w-5 h-5 text-[#10B981]" />;
  };

  return (
    <div className="min-h-screen bg-ink-deep text-body-text flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <StudentNav
          config={config}
          currentPage="learn"
          user={user}
          onNavigate={(page) => onNavigate && onNavigate(page)}
        />

        {/* Lesson Player & Sidebar Rail Grid */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            
            {/* LEFT 2/3 COLUMN: VIDEO PLAYER & LESSON DETAILS */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* VIDEO PLAYER CONTAINER (16:9) */}
              <div
                ref={playerContainerRef}
                id="lesson-player-stage"
                onMouseMove={handleMouseMove}
                className="relative aspect-video w-full rounded-2xl bg-ink-deep border-2 border-ink-border overflow-hidden flex flex-col justify-between select-none shadow-2xl"
              >
                {/* 1. BUNNY EMBED IFRAME PLACEHOLDER */}
                {/* // TODO(handoff): replace with signed Bunny Stream embed */}
                {loadState.status === 'loading' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-raised">
                    <Skeleton height="100%" width="100%" className="rounded-none" />
                  </div>
                ) : loadState.status === 'success' && loadState.data.isLocked ? (
                  /* LOCKED LESSON COVER */
                  <div className="absolute inset-0 bg-ink-deep/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                    <div className="w-14 h-14 rounded-full bg-flag-red/20 border border-flag-red/40 text-flag-red flex items-center justify-center">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-xl text-paper-soft">
                        Live Cohort 2 Exclusive Module
                      </h3>
                      <p className="text-xs text-muted-text max-w-sm">
                        This advanced commercial deployment module is reserved for Live Cohort students with instructor review.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => onOpenCheckout && onOpenCheckout('cohort')}
                    >
                      Upgrade to Cohort 2 Access
                    </Button>
                  </div>
                ) : (
                  <div className="absolute inset-0">
                    {/*
                      Token-signed HLS, played through our own element rather
                      than Bunny's iframe — see useLessonPlayer for why. The
                      poster stays dark so no frame paints before playback.
                    */}
                    <video
                      ref={player.videoRef}
                      id="lesson-player-video"
                      className="absolute inset-0 w-full h-full bg-ink-deep"
                      playsInline
                      // Never `auto`: preloading a two-hour lesson the student
                      // may not watch is exactly the data cost this app exists
                      // to avoid.
                      preload="metadata"
                      onClick={togglePlay}
                    />

                    {player.status === 'error' ? (
                      <div className="absolute inset-0 bg-ink-deep/95 flex flex-col items-center justify-center p-6 text-center gap-2">
                        <WifiOff className="w-8 h-8 text-flag-red" />
                        <p className="text-sm text-paper-soft max-w-sm">
                          {player.errorMessage}
                        </p>
                      </div>
                    ) : player.isBuffering || player.status === 'loading' ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="px-3 py-1.5 rounded-lg bg-ink-deep/80 text-xs font-mono text-body-text">
                          Buffering…
                        </div>
                      </div>
                    ) : !isPlaying ? (
                      <button
                        type="button"
                        onClick={togglePlay}
                        aria-label="Play lesson"
                        className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                      >
                        <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-flag-red text-paper-soft flex items-center justify-center shadow-2xl ring-4 ring-flag-red/30">
                          <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-current" />
                        </span>
                      </button>
                    ) : null}
                  </div>
                )}

                {/* 2. WATERMARK OVERLAY (STUDENT NAME & EMAIL, LOWER-RIGHT) */}
                <div
                  id="player-watermark"
                  className="absolute bottom-16 right-4 sm:bottom-20 sm:right-6 pointer-events-none z-10 opacity-35 text-[11px] sm:text-xs font-mono text-paper-soft drop-shadow-md select-none"
                >
                  {user?.fullName || 'Chidi Okonkwo'} · {user?.email || 'chidi.okonkwo@gmail.com'}
                </div>

                {/* 3. CUSTOM CONTROL STRIP (MIN 48PX TOUCH TARGETS, ONE-HANDED THUMB FRIENDLY) */}
                <div
                  id="player-control-strip"
                  className={`relative mt-auto w-full bg-gradient-to-t from-ink-deep via-ink-raised/95 to-transparent px-3 sm:px-4 py-2 sm:py-3 space-y-2 z-20 transition-opacity duration-200 ${
                    showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Scrubber Seek Bar */}
                  <div className="flex items-center gap-3">
                    <input
                      id="player-scrubber-slider"
                      type="range"
                      min={0}
                      max={totalSeconds}
                      value={currentTimeSeconds}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-ink-border rounded-lg appearance-none cursor-pointer accent-flag-red focus:outline-none"
                      aria-label="Video scrubber"
                    />
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    {/* Left: Play/Pause & Timestamps */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="player-play-pause-btn"
                        onClick={togglePlay}
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-ink-border/80 hover:bg-flag-red text-paper-soft transition-colors focus:ring-2 focus:ring-flag-red"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="font-mono text-xs text-body-text pl-1">
                        <span>{formatTime(currentTimeSeconds)}</span>
                        <span className="text-muted-text"> / </span>
                        <span className="text-muted-text">{formatTime(totalSeconds)}</span>
                      </div>
                    </div>

                    {/* Right: Quality, Data Saver & Fullscreen */}
                    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                      {/* Live Data Usage Estimate */}
                      <div
                        id="player-data-estimate-badge"
                        className="hidden md:flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded bg-ink-border/70 text-body-text border border-ink-border"
                        title="Estimated Nigerian data consumption for remaining duration"
                      >
                        <Wifi className="w-3 h-3 text-flag-red" />
                        <span>~{estimatedRemainingMb} MB remaining at {quality}</span>
                      </div>

                      {/* Quality Select (Defaults to 480p, NOT Auto) */}
                      <div className="relative">
                        <select
                          id="player-quality-select"
                          value={quality}
                          onChange={(e) => handleQualityChange(e.target.value as VideoQuality)}
                          className="min-h-[48px] px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-ink-border text-paper-soft border border-[#2D3A63] focus:ring-2 focus:ring-flag-red focus:outline-none cursor-pointer"
                          aria-label="Select Video Stream Quality"
                        >
                          {/*
                            Driven by the manifest once it has parsed, not by
                            config alone: offering a rendition Bunny did not
                            encode would silently play a different one. There is
                            deliberately no "Auto" entry — see useLessonPlayer.
                          */}
                          {(player.availableQualities.length > 0
                            ? player.availableQualities
                            : config.player?.availableQualities || ['360p', '480p', '720p', '1080p']
                          ).map((q) => (
                            <option key={q} value={q} className="bg-ink-raised text-paper-soft">
                              {q}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Data Saver Toggle */}
                      <button
                        type="button"
                        id="player-data-saver-toggle"
                        onClick={handleDataSaverToggle}
                        className={`min-h-[48px] px-3 py-1 text-xs font-mono font-medium rounded-lg border transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-flag-red ${
                          dataSaver
                            ? 'bg-flag-red text-paper-soft border-flag-red'
                            : 'bg-ink-border/80 text-muted-text border-[#2D3A63] hover:text-body-text'
                        }`}
                        title="Toggle Data Saver (Forces 360p mobile stream)"
                      >
                        <WifiOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Data Saver</span>
                      </button>

                      {/* Fullscreen Button */}
                      <button
                        type="button"
                        id="player-fullscreen-btn"
                        onClick={toggleFullscreen}
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-ink-border/80 hover:bg-[#2D3A63] text-paper-soft transition-colors focus:ring-2 focus:ring-flag-red"
                        aria-label="Toggle Fullscreen"
                      >
                        {isFullscreen ? (
                          <Minimize className="w-5 h-5" />
                        ) : (
                          <Maximize className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline Care Message when Data Saver is On */}
                  {dataSaver && (
                    <div
                      id="player-data-saver-notice"
                      className="text-[11px] font-medium text-[#10B981] bg-[#059669]/15 border border-[#059669]/30 px-3 py-1 rounded flex items-center gap-1.5"
                    >
                      <Info className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Data Saver on — using about half the data (~{estimatedRemainingMb} MB for remaining lesson).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* LESSON DETAILS & ACTION STRIP */}
              {loadState.status === 'loading' ? (
                <div className="space-y-4">
                  <Skeleton height={16} width={180} />
                  <Skeleton height={32} width="80%" />
                  <div className="flex gap-3">
                    <Skeleton height={48} width={160} />
                    <Skeleton height={48} width={160} />
                  </div>
                </div>
              ) : loadState.status === 'success' ? (
                <div className="space-y-4">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-text">
                    <span>Module {loadState.data.module.number}: {loadState.data.module.title}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-flag-red font-semibold">Active Lesson</span>
                  </div>

                  {/* Title & Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="font-display font-black text-xl sm:text-2xl lg:text-3xl text-paper-soft tracking-tight">
                      {loadState.data.lesson.title}
                    </h1>

                    {/* Mark Complete & Next Lesson Buttons (NO AUTOPLAY) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        id="lesson-mark-complete-btn"
                        variant={isCompleted ? 'secondary' : 'primary'}
                        size="md"
                        isLoading={isTogglingComplete}
                        onClick={handleToggleComplete}
                        leftIcon={<CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-[#10B981]' : ''}`} />}
                        className="min-h-[48px]"
                      >
                        {isCompleted ? 'Completed ✓' : 'Mark complete'}
                      </Button>

                      {loadState.data.nextLessonId && (
                        <Button
                          id="lesson-next-btn"
                          variant="secondary"
                          size="md"
                          onClick={() =>
                            onNavigate && onNavigate('learn', loadState.data.nextLessonId!)
                          }
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                          className="min-h-[48px]"
                        >
                          Next lesson →
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {loadState.data.lesson.description && (
                    <p className="text-sm text-muted-text leading-relaxed max-w-3xl">
                      {loadState.data.lesson.description}
                    </p>
                  )}
                </div>
              ) : null}

              {/* MOBILE SYLLABUS TOGGLE BUTTON */}
              <div className="lg:hidden">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => setShowMobileOutline(!showMobileOutline)}
                  leftIcon={<Layers className="w-4 h-4" />}
                  className="min-h-[48px]"
                >
                  {showMobileOutline ? 'Hide Course Outline' : 'View Full Course Outline'}
                </Button>
              </div>

              {/* MOBILE SYLLABUS ACCORDION (WHEN TOGGLED) */}
              {showMobileOutline && (
                <div className="lg:hidden p-4 rounded-xl border border-ink-border bg-ink-raised space-y-4">
                  <h3 className="font-display font-bold text-base text-paper-soft">
                    Course Syllabus
                  </h3>
                  <div className="space-y-4">
                    {modules.map((mod) => (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-xs font-mono font-semibold text-flag-red">
                          Module {mod.number}: {mod.title}
                        </div>
                        <div className="space-y-1 pl-2 border-l border-ink-border">
                          {mod.lessons.map((les) => (
                            <button
                              key={les.id}
                              type="button"
                              // The lesson id is otherwise nowhere in the DOM —
                              // the outline navigates by handler, not by href.
                              // smoke-browser.mjs reads these to probe playback
                              // authorization for every lesson individually.
                              data-lesson-id={les.id}
                              onClick={() => {
                                setShowMobileOutline(false);
                                onNavigate && onNavigate('learn', les.id);
                              }}
                              className={`w-full text-left p-2 rounded text-xs flex items-center justify-between ${
                                les.id === lessonId
                                  ? 'bg-flag-red/20 text-paper-soft font-bold border border-flag-red/50'
                                  : 'text-muted-text hover:bg-ink-border'
                              }`}
                            >
                              <span className="truncate pr-2">{les.title}</span>
                              <span className="font-mono text-[10px] text-muted-text">
                                {les.durationMinutes}m
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ATTACHED RESOURCES SECTION */}
              <div className="space-y-4 pt-4 border-t border-ink-border">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg text-paper-soft flex items-center gap-2">
                    <span>Lesson Resources & Blueprints</span>
                    <Badge variant="neutral" size="sm">
                      {resources.length}
                    </Badge>
                  </h2>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('vault')}
                    className="text-xs text-flag-red hover:underline font-mono"
                  >
                    Open all in Vault →
                  </button>
                </div>

                {resources.length === 0 ? (
                  <EmptyState
                    icon={<FileCode className="w-8 h-8 text-muted-text" />}
                    headline="No Attached Files"
                    body="This lesson is a pure conceptual walkthrough. General starter blueprints are in the Vault."
                  />
                ) : (
                  <div className="space-y-2">
                    {resources.map((res) => (
                      <div
                        key={res.id}
                        id={`lesson-resource-row-${res.id}`}
                        className="p-3 sm:p-4 rounded-xl border border-ink-border bg-ink-raised/70 hover:bg-ink-border/40 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-ink-border flex items-center justify-center flex-shrink-0">
                            {getResourceIcon(res.fileFormat, res.kind)}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-sm font-semibold text-paper-soft truncate">
                              {res.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs font-mono text-muted-text">
                              <span className="px-1.5 py-0.2 bg-ink-border rounded text-[10px] text-body-text">
                                {res.fileFormat}
                              </span>
                              <span>{res.sizeFormatted}</span>
                            </div>
                          </div>
                        </div>

                        {/* // TODO(handoff): signed download URL */}
                        <a
                          href={res.downloadUrl}
                          id={`download-btn-${res.id}`}
                          download
                          className="min-h-[44px] px-3.5 py-2 rounded-lg bg-ink-border hover:bg-flag-red text-paper-soft text-xs font-semibold flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-flag-red flex-shrink-0"
                          title="Download Resource"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COMMENTS & DISCUSSION SECTION */}
              <div className="space-y-4 pt-4 border-t border-ink-border">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg text-paper-soft flex items-center gap-2">
                    <span>Discussion & Questions</span>
                    <Badge variant="neutral" size="sm">
                      {comments.length}
                    </Badge>
                  </h2>
                  <span className="text-xs font-mono text-muted-text">
                    Instructor replies in &lt; 12 hrs
                  </span>
                </div>

                {/* Comment Post Form */}
                <form
                  onSubmit={handlePostComment}
                  id="lesson-comment-form"
                  className="space-y-2 p-4 rounded-xl border border-ink-border bg-ink-raised"
                >
                  <textarea
                    id="lesson-comment-textarea"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ask a question about this lesson or share your build insight..."
                    rows={3}
                    className="w-full bg-ink-deep border border-ink-border focus:border-flag-red rounded-lg p-3 text-sm text-paper-soft placeholder-muted-text focus:outline-none focus:ring-1 focus:ring-flag-red resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      id="post-comment-submit-btn"
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isPostingComment}
                      disabled={!commentText.trim()}
                      rightIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Post Comment
                    </Button>
                  </div>
                </form>

                {/* Flat Comments List (Newest first, pinned at top) */}
                {comments.length === 0 ? (
                  <EmptyState
                    icon={<Info className="w-8 h-8 text-muted-text" />}
                    headline="No Questions Yet"
                    body="Be the first to post a question or share your progress from this lesson."
                  />
                ) : (
                  <div className="space-y-3 pt-2">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        id={`comment-item-${c.id}`}
                        className={`p-4 rounded-xl border transition-colors space-y-2 ${
                          c.isPinned
                            ? 'bg-[#0D153B] border-flag-red/40 ring-1 ring-flag-red/20'
                            : 'bg-ink-raised/60 border-ink-border'
                        }`}
                      >
                        {/* Comment Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-ink-border text-paper-soft flex items-center justify-center text-xs font-bold font-mono">
                              {c.authorName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-paper-soft">
                              {c.authorName}
                            </span>
                            {c.authorIsAdmin && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-flag-red text-paper-soft">
                                Instructor
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-text">
                            {c.isPinned && (
                              <span className="flex items-center gap-1 text-flag-red">
                                <Pin className="w-3 h-3 fill-current" />
                                <span>Pinned</span>
                              </span>
                            )}
                            <span>{c.createdAt}</span>
                          </div>
                        </div>

                        {/* Comment Body */}
                        <p className="text-xs sm:text-sm text-body-text leading-relaxed pl-9">
                          {c.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT 1/3 COLUMN: COURSE NAVIGATION RAIL (DESKTOP) */}
            <div className="hidden lg:block space-y-4 sticky top-20">
              <div className="p-4 rounded-2xl border border-ink-border bg-ink-raised space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-ink-border">
                  <h3 className="font-display font-bold text-base text-paper-soft flex items-center gap-2">
                    <Layers className="w-4 h-4 text-flag-red" />
                    <span>Course Syllabus</span>
                  </h3>
                  <span className="text-xs font-mono text-muted-text">
                    {modules.length} Modules
                  </span>
                </div>

                {/* Module Tree */}
                <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                  {modules.map((mod) => (
                    <div key={mod.id} className="space-y-1.5">
                      <div className="text-xs font-mono font-bold text-flag-red flex items-center justify-between">
                        <span>Module 0{mod.number}</span>
                        <span className="text-muted-text font-normal">{mod.lessons.length} lessons</span>
                      </div>
                      <div className="text-xs font-semibold text-body-text pb-1 truncate">
                        {mod.title}
                      </div>

                      {/* Lessons list */}
                      <div className="space-y-1 pl-2 border-l border-ink-border">
                        {mod.lessons.map((les, idx) => {
                          const isCurrent = les.id === lessonId;
                          return (
                            <button
                              key={les.id}
                              data-lesson-id={les.id}
                              id={`nav-rail-lesson-${les.id}`}
                              type="button"
                              onClick={() => onNavigate && onNavigate('learn', les.id)}
                              className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                isCurrent
                                  ? 'bg-flag-red text-paper-soft font-bold shadow-md'
                                  : 'text-muted-text hover:text-paper-soft hover:bg-ink-border/70'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                {isCurrent ? (
                                  <Play className="w-3.5 h-3.5 fill-current flex-shrink-0" />
                                ) : (
                                  <span className="font-mono text-[10px] text-muted-text flex-shrink-0">
                                    {idx + 1}.
                                  </span>
                                )}
                                <span className="truncate">{les.title}</span>
                              </div>
                              <span className="font-mono text-[10px] opacity-80 flex-shrink-0">
                                {les.durationMinutes}m
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};
