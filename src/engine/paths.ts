/**
 * Realtime Database path builders.
 *
 * Every path in the app is constructed here so the shape of the tree is
 * described in exactly one place, and so a rename cannot silently desync the
 * client from `firebase/database.rules.json`.
 *
 * Shape note: the tree is deliberately split into small sibling subtrees rather
 * than one fat `rooms/{id}/state` blob. A stroke arriving must not wake the
 * scoreboard listener; a score change must not re-deliver the player list.
 * Listeners subscribe to the narrowest path that answers their question.
 */

export const paths = {
  /** code -> roomId lookup, so joining never scans the room list. */
  roomCode: (code: string) => `roomCodes/${code}`,

  room: (roomId: string) => `rooms/${roomId}`,
  roomHostId: (roomId: string) => `rooms/${roomId}/hostId`,
  roomStatus: (roomId: string) => `rooms/${roomId}/status`,
  roomMode: (roomId: string) => `rooms/${roomId}/currentMode`,
  roomSettings: (roomId: string) => `rooms/${roomId}/settings`,

  /**
   * Character reservations, keyed by character so the database itself enforces
   * uniqueness. Claiming is a transaction on a single node — two players
   * tapping the same character at the same instant cannot both win.
   */
  characters: (roomId: string) => `roomCharacters/${roomId}`,
  character: (roomId: string, characterId: string) =>
    `roomCharacters/${roomId}/${characterId}`,

  players: (roomId: string) => `roomPlayers/${roomId}`,
  player: (roomId: string, playerId: string) => `roomPlayers/${roomId}/${playerId}`,
  playerReady: (roomId: string, playerId: string) => `roomPlayers/${roomId}/${playerId}/ready`,

  /** Server-authoritative. Never client-writable. */
  scores: (roomId: string) => `playerScores/${roomId}`,
  score: (roomId: string, playerId: string) => `playerScores/${roomId}/${playerId}`,

  presence: (roomId: string) => `presence/${roomId}`,
  playerPresence: (roomId: string, playerId: string) => `presence/${roomId}/${playerId}`,

  game: (roomId: string) => `games/${roomId}/current`,
  gamePhase: (roomId: string) => `games/${roomId}/current/phase`,
  gamePhaseEndsAt: (roomId: string) => `games/${roomId}/current/phaseEndsAt`,
  gameCurrentPlayer: (roomId: string) => `games/${roomId}/current/currentPlayerId`,
  gameTurnOrder: (roomId: string) => `games/${roomId}/current/turnOrder`,

  /**
   * A player may only ever read their own node here. The impostor's payload
   * has no `word` child at all — see ARCHITECTURE.md, "Secrecy".
   */
  playerSecret: (roomId: string, gameId: string, playerId: string) =>
    `playerSecrets/${roomId}/${gameId}/${playerId}`,

  strokes: (roomId: string, gameId: string) => `strokes/${roomId}/${gameId}`,
  stroke: (roomId: string, gameId: string, strokeId: string) =>
    `strokes/${roomId}/${gameId}/${strokeId}`,

  /**
   * كانت إيش؟ only: one stroke bucket per link in the chain.
   *
   * The shared `strokes` bucket above is readable by every member of the room,
   * which is right for the four modes where everyone watches one canvas — and
   * wrong here, where reading an earlier drawing would let a player reason back
   * to the original sentence. Each link's strokes are gated by the same
   * `visibleTo` grant that gates the link itself.
   */
  linkStrokes: (roomId: string, gameId: string, index: number) =>
    `linkStrokes/${roomId}/${gameId}/${index}`,

  /**
   * كانت إيش؟ Duo only: two independent chains instead of one, so both need a
   * `track` segment ('0' | '1') the single-chain paths above don't have. Kept
   * as entirely separate subtrees rather than reusing `chains`/`linkStrokes`
   * with an optional track, so the group ruleset's paths and rules stay
   * byte-for-byte what they were before Duo existed.
   */
  duoChain: (roomId: string, gameId: string, track: string) =>
    `duoChains/${roomId}/${gameId}/${track}`,
  duoChainLink: (roomId: string, gameId: string, track: string, index: number) =>
    `duoChains/${roomId}/${gameId}/${track}/${index}`,
  duoLinkStrokes: (roomId: string, gameId: string, track: string, index: number) =>
    `duoLinkStrokes/${roomId}/${gameId}/${track}/${index}`,

  votes: (roomId: string, gameId: string) => `votes/${roomId}/${gameId}`,
  vote: (roomId: string, gameId: string, voterId: string) =>
    `votes/${roomId}/${gameId}/${voterId}`,

  /** Who has voted, without who for. Readable while `votes` stays sealed. */
  voteMarks: (roomId: string, gameId: string) => `voteMarks/${roomId}/${gameId}`,
  voteMark: (roomId: string, gameId: string, voterId: string) =>
    `voteMarks/${roomId}/${gameId}/${voterId}`,

  guesses: (roomId: string, gameId: string) => `guesses/${roomId}/${gameId}`,

  chain: (roomId: string, gameId: string) => `chains/${roomId}/${gameId}`,
  chainLink: (roomId: string, gameId: string, index: number) =>
    `chains/${roomId}/${gameId}/${index}`,

  /** Firebase-provided, not ours: connection state and clock skew. */
  infoConnected: '.info/connected',
  infoServerTimeOffset: '.info/serverTimeOffset',
} as const;
