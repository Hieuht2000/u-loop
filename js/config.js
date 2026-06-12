"use strict";
/* u-loop · config.js — shared online leaderboard (Supabase).
 * The publishable key below is safe to ship publicly: row-level
 * security limits it to reading and inserting leaderboard rows.
 */
UL.CONFIG = {
  leaderboard: {
    provider: "supabase",
    url: "https://bhiletiufnnmyvkhzyzu.supabase.co",          // Settings -> Data API
    anonKey: "sb_publishable_1TVYMTUzhO4t0GMlqCkP9w_GKcbbxUl" // Settings -> API Keys
  }
};
