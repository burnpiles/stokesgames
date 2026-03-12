/**
 * StokeGames External SDK v1
 * For use by Type B (3rd-party iframe) and Type C (self-hosted subdomain) games.
 *
 * Usage:
 *   <script src="https://stokesgames.com/sdk/v1/stokes-sdk.js"></script>
 *   <script>
 *     window.StokesSDK.init({ gameId: 'your-game-id', gameSlug: 'your-game-slug' });
 *     // On game start:
 *     window.StokesSDK.onStart();
 *     // On game over:
 *     window.StokesSDK.onGameOver(score, { level: 3 });
 *   </script>
 */
(function () {
  'use strict';

  var STOKES_ORIGIN = 'https://stokesgames.com';

  window.StokesSDK = {
    gameId: null,
    gameSlug: null,
    _callbacks: {},
    _ready: false,

    /**
     * Initialize the SDK. Must be called before any other methods.
     * @param {{ gameId: string, gameSlug: string }} config
     */
    init: function (config) {
      this.gameId = config.gameId;
      this.gameSlug = config.gameSlug;
      this._ready = true;
      this._listenFromPlatform();
      this._post('SDK_READY', { gameId: config.gameId, gameSlug: config.gameSlug });
    },

    /** Call when a new game session begins */
    onStart: function () {
      this._post('GAME_START', { gameId: this.gameId, gameSlug: this.gameSlug });
    },

    /**
     * Call when a session ends with a final score.
     * @param {number} score
     * @param {Object} [metadata] - optional extra data (level, character, etc.)
     */
    onGameOver: function (score, metadata) {
      this._post('GAME_OVER', {
        gameId: this.gameId,
        gameSlug: this.gameSlug,
        score: Math.floor(score),
        metadata: metadata || {},
        timestamp: Date.now(),
      });
    },

    /** Call when the game is paused */
    onPause: function () {
      this._post('GAME_PAUSE', { gameId: this.gameId });
    },

    /** Call when the game is resumed */
    onResume: function () {
      this._post('GAME_RESUME', { gameId: this.gameId });
    },

    /** Ask the platform to open the leaderboard overlay */
    showLeaderboard: function () {
      this._post('SHOW_LEADERBOARD', { gameId: this.gameId });
    },

    /** Ask the platform to open the share card for the last score */
    showShareCard: function () {
      this._post('SHOW_SHARE', { gameId: this.gameId });
    },

    /**
     * Trigger a toast notification in the platform UI
     * @param {string} message
     * @param {'default'|'success'|'error'} [variant]
     */
    triggerToast: function (message, variant) {
      this._post('TOAST', { message: message, variant: variant || 'default' });
    },

    /**
     * Listen for events from the platform (e.g. auth changes, score confirmed)
     * @param {string} event - e.g. 'STOKES_USER_STATE', 'STOKES_SCORE_CONFIRMED'
     * @param {Function} callback
     */
    listen: function (event, callback) {
      this._callbacks[event] = callback;
    },

    _listenFromPlatform: function () {
      var self = this;
      window.addEventListener('message', function (e) {
        if (e.origin !== STOKES_ORIGIN) return;
        var data = e.data;
        if (!data || !data.type) return;
        var cb = self._callbacks[data.type];
        if (cb) cb(data);
      });
    },

    _post: function (type, data) {
      if (window.parent === window) return; // Not in iframe
      var payload = Object.assign({}, data, { type: 'STOKES_' + type });
      window.parent.postMessage(payload, STOKES_ORIGIN);
    },
  };
})();
