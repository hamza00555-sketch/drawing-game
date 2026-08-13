/**
 * Fonts, self-hosted.
 *
 * Deliberately NOT loaded from Google Fonts. A CDN <link> is a third-party
 * dependency on the critical render path, it is blocked outright on some
 * networks, and it costs an extra connection before a single glyph appears.
 * A party game whose Arabic type silently falls back to a system sans has lost
 * its identity on the first screen.
 *
 * Only the Arabic subsets and the weights actually used are imported. Pulling
 * the full families would ship Latin, Vietnamese and Devanagari glyph ranges
 * nobody in this game will ever render.
 */

// Display — headings, the wordmark, room codes.
import '@fontsource/baloo-bhaijaan-2/arabic-700.css';
import '@fontsource/baloo-bhaijaan-2/arabic-800.css';
// Baloo's Latin covers room codes, which are intentionally Latin/numeric.
import '@fontsource/baloo-bhaijaan-2/latin-700.css';
import '@fontsource/baloo-bhaijaan-2/latin-800.css';

// Body — everything else.
import '@fontsource/tajawal/arabic-400.css';
import '@fontsource/tajawal/arabic-500.css';
import '@fontsource/tajawal/arabic-700.css';
import '@fontsource/tajawal/latin-400.css';
