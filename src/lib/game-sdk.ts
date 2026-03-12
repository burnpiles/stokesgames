/**
 * StokeGames JS SDK — Type A (1st Party, direct import)
 * Used by built-in games to communicate with the platform.
 *
 * For Type B/C (3rd-party / self-hosted), see /public/sdk/v1/stokes-sdk.js
 */

export interface SDKConfig {
  gameId: string
  gameSlug: string
}

export interface SDKUser {
  id: string
  clerkId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  xp: number
  rankTier: string
}

export interface ScoreSubmissionPayload {
  gameId: string
  gameSlug: string
  score: number
  metadata?: Record<string, unknown>
  timestamp: number
}

export type SDKEvent =
  | 'ready'
  | 'start'
  | 'game_over'
  | 'pause'
  | 'resume'
  | 'score_submitted'
  | 'leaderboard_open'
  | 'share_open'
  | 'auth_change'

type EventCallback<T = unknown> = (data: T) => void

/**
 * GameSDK — instantiated once per game session.
 * Bridges the game lifecycle to the StokeGames platform.
 */
export class GameSDK {
  private config: SDKConfig
  private user: SDKUser | null = null
  private lastScore: number = 0
  private listeners: Map<SDKEvent, EventCallback[]> = new Map()
  private isReady: boolean = false

  constructor(config: SDKConfig) {
    this.config = config
    this._setupPlatformListener()
    this._requestUserState()
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  /** Call when the game canvas is mounted and ready for play */
  onReady(): void {
    this.isReady = true
    this._emit('ready', {})
    this._postToPlatform('SDK_READY', {
      gameId: this.config.gameId,
      gameSlug: this.config.gameSlug,
    })
  }

  /** Call when a new game session/round begins */
  onStart(): void {
    this._emit('start', {})
    this._postToPlatform('GAME_START', {
      gameId: this.config.gameId,
      gameSlug: this.config.gameSlug,
    })
  }

  /**
   * Call when a session ends with a final score.
   * This triggers score submission + leaderboard update via the platform.
   */
  onGameOver(score: number, metadata?: Record<string, unknown>): void {
    this.lastScore = Math.floor(score)
    const payload: ScoreSubmissionPayload = {
      gameId: this.config.gameId,
      gameSlug: this.config.gameSlug,
      score: this.lastScore,
      metadata,
      timestamp: Date.now(),
    }
    this._emit('game_over', payload)
    this._postToPlatform('GAME_OVER', payload)
  }

  /** Call when the game is paused (e.g. tab unfocus, pause menu) */
  onPause(): void {
    this._emit('pause', {})
    this._postToPlatform('GAME_PAUSE', {
      gameId: this.config.gameId,
    })
  }

  /** Call when the game is resumed after a pause */
  onResume(): void {
    this._emit('resume', {})
    this._postToPlatform('GAME_RESUME', {
      gameId: this.config.gameId,
    })
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  /** Returns the currently authenticated user, or null if not logged in */
  getUser(): SDKUser | null {
    return this.user
  }

  /** Subscribe to auth state changes */
  onAuthChange(callback: (user: SDKUser | null) => void): () => void {
    return this._on('auth_change', callback as EventCallback)
  }

  // ─── UI Triggers ──────────────────────────────────────────────────────────

  /** Ask the platform to open the leaderboard overlay */
  showLeaderboard(): void {
    this._emit('leaderboard_open', { gameId: this.config.gameId })
    this._postToPlatform('SHOW_LEADERBOARD', {
      gameId: this.config.gameId,
    })
  }

  /** Ask the platform to open the share card for the last score */
  showShareCard(): void {
    this._emit('share_open', { score: this.lastScore })
    this._postToPlatform('SHOW_SHARE', {
      gameId: this.config.gameId,
      score: this.lastScore,
    })
  }

  /** Fire a platform toast notification */
  triggerToast(message: string, variant: 'default' | 'success' | 'error' = 'default'): void {
    this._postToPlatform('TOAST', { message, variant })
  }

  // ─── Event Bus ────────────────────────────────────────────────────────────

  /** Subscribe to an SDK event. Returns an unsubscribe function. */
  on<T = unknown>(event: SDKEvent, callback: EventCallback<T>): () => void {
    return this._on(event, callback as EventCallback)
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private _on(event: SDKEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
    return () => {
      const cbs = this.listeners.get(event) ?? []
      this.listeners.set(
        event,
        cbs.filter((cb) => cb !== callback)
      )
    }
  }

  private _emit(event: SDKEvent, data: unknown): void {
    const cbs = this.listeners.get(event) ?? []
    cbs.forEach((cb) => cb(data))
  }

  /**
   * For Type A games embedded as React components directly in the Next.js app,
   * we don't need postMessage — we can use a shared event bus.
   * But we still emit postMessage for composability (e.g. if game is in an iframe).
   */
  private _postToPlatform(type: string, data: Record<string, unknown>): void {
    if (typeof window === 'undefined') return
    // Type A: dispatch a custom DOM event the parent GameEmbed component listens to
    window.dispatchEvent(
      new CustomEvent('stokes:sdk', {
        detail: { type: `STOKES_${type}`, ...data },
        bubbles: true,
      })
    )
    // Also postMessage for iframe compatibility
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: `STOKES_${type}`, ...data },
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://stokesgames.com'
      )
    }
  }

  /** Ask the platform for the current user session */
  private _requestUserState(): void {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('stokes:sdk', {
        detail: { type: 'STOKES_REQUEST_USER' },
        bubbles: true,
      })
    )
  }

  /** Listen for messages from the platform back to the game */
  private _setupPlatformListener(): void {
    if (typeof window === 'undefined') return

    const handler = (event: MessageEvent | CustomEvent) => {
      let data: Record<string, unknown>

      if (event instanceof MessageEvent) {
        // Filter out non-Stokes messages in production
        if (
          process.env.NODE_ENV === 'production' &&
          event.origin !== 'https://stokesgames.com' &&
          event.origin !== window.location.origin
        ) {
          return
        }
        data = event.data
      } else {
        // CustomEvent from parent component
        data = (event as CustomEvent).detail
      }

      if (!data || typeof data.type !== 'string') return

      switch (data.type) {
        case 'STOKES_USER_STATE':
          this.user = (data.user as SDKUser) ?? null
          this._emit('auth_change', this.user)
          break
        case 'STOKES_SCORE_CONFIRMED':
          this._emit('score_submitted', data)
          break
        default:
          break
      }
    }

    window.addEventListener('message', handler)
    window.addEventListener('stokes:platform' as keyof WindowEventMap, handler as EventListener)
  }

  /** Clean up event listeners — call when game component unmounts */
  destroy(): void {
    this.listeners.clear()
  }
}

// ─── postMessage SDK Builder (for Type B/C external games) ─────────────────
// This is the source of truth for the SDK served at /public/sdk/v1/stokes-sdk.js
// It's embedded here for documentation — the actual file is generated at build time.

export const STOKES_SDK_SOURCE = `
(function() {
  'use strict';
  const STOKES_ORIGIN = '${
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://stokesgames.com'
  }';

  window.StokesSDK = {
    gameId: null,
    gameSlug: null,
    _callbacks: {},

    init: function(config) {
      this.gameId = config.gameId;
      this.gameSlug = config.gameSlug;
      this._post('SDK_READY', {});
      this._listenFromPlatform();
    },

    onStart: function() {
      this._post('GAME_START', {});
    },

    onGameOver: function(score, metadata) {
      this._post('GAME_OVER', {
        score: Math.floor(score),
        gameId: this.gameId,
        gameSlug: this.gameSlug,
        metadata: metadata || {},
        timestamp: Date.now()
      });
    },

    onPause: function() {
      this._post('GAME_PAUSE', {});
    },

    onResume: function() {
      this._post('GAME_RESUME', {});
    },

    showLeaderboard: function() {
      this._post('SHOW_LEADERBOARD', { gameId: this.gameId });
    },

    showShareCard: function() {
      this._post('SHOW_SHARE', { gameId: this.gameId });
    },

    triggerToast: function(message, variant) {
      this._post('TOAST', { message: message, variant: variant || 'default' });
    },

    listen: function(event, callback) {
      this._callbacks[event] = callback;
    },

    _listenFromPlatform: function() {
      var self = this;
      window.addEventListener('message', function(e) {
        if (e.origin !== STOKES_ORIGIN) return;
        var cb = self._callbacks[e.data.type];
        if (cb) cb(e.data);
      });
    },

    _post: function(type, data) {
      var payload = Object.assign({ type: 'STOKES_' + type }, data);
      window.parent.postMessage(payload, STOKES_ORIGIN);
    }
  };
})();
`
