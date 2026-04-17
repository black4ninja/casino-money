/**
 * All localStorage keys live here to prevent typos and keep migrations coherent.
 * Each key is scoped per-session where it makes sense, so switching sessions
 * doesn't mix up wallets or dealer ledgers.
 */

export const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  session: "casino-money.session",
  playerAccount: "casino-money.player.account",
  walletChips: (sessionId: string) =>
    `casino-money.player.wallet.${sessionId}`,
  playerHistory: (sessionId: string) =>
    `casino-money.player.history.${sessionId}`,
  dealerLedger: (sessionId: string, dealerId: string) =>
    `casino-money.dealer.ledger.${sessionId}.${dealerId}`,
  /** Last used dealer id so the form pre-fills. Secret key itself is NEVER stored. */
  dealerLastMesa: "casino-money.dealer.last-mesa",
  /** Admin keeps the session list it has created. */
  adminSessions: "casino-money.admin.sessions",
} as const;
