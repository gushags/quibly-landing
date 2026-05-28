import type { MetadataRoute } from 'next'

/**
 * Phase 5 D-05 / D-06 / D-07 — explicit Allow: / for every named AI crawler;
 * no explicit rules for Googlebot/Bingbot/Yandex (defaults apply).
 *
 * D-05 named five crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot,
 * CCBot); RESEARCH.md confirmed Anthropic and OpenAI now operate three bots
 * each (training, search, real-time). Including the expanded list matches the
 * intent of D-05 (allow AI surface area).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'GPTBot',           allow: '/' },
      { userAgent: 'OAI-SearchBot',    allow: '/' },
      { userAgent: 'ChatGPT-User',     allow: '/' },
      { userAgent: 'ClaudeBot',        allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'Claude-User',      allow: '/' },
      { userAgent: 'Google-Extended',  allow: '/' },
      { userAgent: 'PerplexityBot',    allow: '/' },
      { userAgent: 'Perplexity-User',  allow: '/' },
      { userAgent: 'CCBot',            allow: '/' },
    ],
    sitemap: 'https://zeremi.app/sitemap.xml',
  }
}
