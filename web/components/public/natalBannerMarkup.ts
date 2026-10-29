// Static decorative SVG/canvas markup for the Natal banner, ported verbatim
// from the original index.html. Injected via dangerouslySetInnerHTML in
// NatalBanner.tsx to avoid manually re-transcribing hundreds of SVG attrs
// (stroke-width, stroke-linecap, etc.) into JSX/camelCase, which risks
// introducing subtle visual drift. The DOM nodes this produces are exactly
// what lib/natalBanner.ts (ported 1:1 from the original script) expects.
export const NATAL_BANNER_INNER_HTML = `

  <canvas class="natal-banner__snow" aria-hidden="true"></canvas>
  <svg class="natal-banner__lights" aria-hidden="true" preserveAspectRatio="none"></svg>

  <svg class="natal-banner__star" viewBox="0 0 40 40" aria-hidden="true">
    <path fill="currentColor" d="M20 0c1.2 9.5 3.5 17.2 8 20-4.5 2.8-6.8 10.5-8 20-1.2-9.5-3.5-17.2-8-20 4.5-2.8 6.8-10.5 8-20z"/>
  </svg>

  <div class="natal-banner__deco natal-banner__deco--a" aria-hidden="true">
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
      <path d="M32 58V8"/>
      <path d="M32 18l-14 8M32 18l14 8M32 30l-17 10M32 30l17 10M32 42l-20 12M32 42l20 12"/>
    </svg>
  </div>
  <div class="natal-banner__deco natal-banner__deco--b" aria-hidden="true">
    <svg viewBox="0 0 40 40" fill="currentColor"><path d="M20 2l3.5 11.5L35 17l-11.5 3.5L20 32l-3.5-11.5L5 17l11.5-3.5z"/></svg>
  </div>
  <div class="natal-banner__deco natal-banner__deco--c" aria-hidden="true">
    <svg viewBox="0 0 64 64" fill="currentColor">
      <path d="M32 6v52" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M32 14c-7 0-10 6-10 11 7 0 10-5 10-11zM32 14c7 0 10 6 10 11-7 0-10-5-10-11zM32 28c-7 0-10 6-10 11 7 0 10-5 10-11zM32 28c7 0 10 6 10 11-7 0-10-5-10-11zM32 42c-7 0-10 6-10 11 7 0 10-5 10-11zM32 42c7 0 10 6 10 11-7 0-10-5-10-11z"/>
    </svg>
  </div>

  <div class="natal-banner__santa" aria-hidden="true">
    <svg viewBox="0 0 230 84" fill="none">
      <!-- renas -->
    <g transform="translate(128 42)">
      <g class="nb-leap" style="animation-delay:-0.0s">
        <g transform="translate(-12 5)"><path class="nb-leg nb-leg--b" style="animation-delay:-0.08s" d="M0 0L1 8L-4 16"/></g>
        <g transform="translate(-8 5)"><path class="nb-leg nb-leg--b" style="animation-delay:-0.00s" d="M0 0L1 8L-4 16"/></g>
        <ellipse cx="0" cy="0" rx="17" ry="8" fill="currentColor"/>
        <circle cx="-17" cy="-2" r="2.4" fill="currentColor"/>
        <g transform="translate(7 5)"><path class="nb-leg nb-leg--f" style="animation-delay:-0.08s" d="M0 0L2 8L-1 16"/></g>
        <g transform="translate(11 5)"><path class="nb-leg nb-leg--f" style="animation-delay:-0.00s" d="M0 0L2 8L-1 16"/></g>
        <circle class="nb-anchor-a" cx="12" cy="-6" r=".6" fill="currentColor" opacity="0"/>
        <g class="nb-head" style="animation-delay:-0.00s">
          <path d="M10 -4L20 -14" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <circle cx="23" cy="-16" r="5.5" fill="currentColor"/>
          <path d="M22 -21l-3-9m3 9l5-8m-8 1l-4-2m12 1l4-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </g>
      </g>
    </g>
    <g transform="translate(182 44)">
      <g class="nb-leap" style="animation-delay:-0.2s">
        <g transform="translate(-12 5)"><path class="nb-leg nb-leg--b" style="animation-delay:-0.28s" d="M0 0L1 8L-4 16"/></g>
        <g transform="translate(-8 5)"><path class="nb-leg nb-leg--b" style="animation-delay:-0.20s" d="M0 0L1 8L-4 16"/></g>
        <ellipse cx="0" cy="0" rx="17" ry="8" fill="currentColor"/>
        <circle cx="-17" cy="-2" r="2.4" fill="currentColor"/>
        <g transform="translate(7 5)"><path class="nb-leg nb-leg--f" style="animation-delay:-0.28s" d="M0 0L2 8L-1 16"/></g>
        <g transform="translate(11 5)"><path class="nb-leg nb-leg--f" style="animation-delay:-0.20s" d="M0 0L2 8L-1 16"/></g>
        <circle class="nb-anchor-b" cx="12" cy="-6" r=".6" fill="currentColor" opacity="0"/>
        <g class="nb-head" style="animation-delay:-0.20s">
          <path d="M10 -4L20 -14" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <circle cx="23" cy="-16" r="5.5" fill="currentColor"/>
          <path d="M22 -21l-3-9m3 9l5-8m-8 1l-4-2m12 1l4-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="28.6" cy="-14.6" r="2.3" fill="#E39A8A" class="nb-nose"/>
        </g>
      </g>
    </g>
      <!-- rédeas (desenhadas pelo JS, ligadas às mãos e às renas) -->
      <path class="nb-rein nb-rein1" d="M68 37Q104 41 140 36"/>
      <path class="nb-rein nb-rein2" d="M140 36Q166 40 194 38"/>
      <!-- trenó -->
      <g class="nb-sleigh">
        <circle class="nb-anchor-tail" cx="3" cy="68" r=".6" fill="currentColor" opacity="0"/>
        <path d="M8 36c0 14 12 24 30 24h40c8 0 9-8 3-12l-8-12z" fill="currentColor"/>
        <path d="M2 70c16 5 62 5 84-4 7-3 8-9 3-10" stroke="#E8B866" stroke-width="3" stroke-linecap="round"/>
        <path d="M26 62v8M62 62v6" stroke="#E8B866" stroke-width="2.4" stroke-linecap="round"/>
        <g class="nb-sack">
          <circle cx="22" cy="32" r="12" fill="currentColor" opacity=".8"/>
          <path d="M16 22l6 4 6-4" stroke="#E8B866" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <g class="nb-santa-body">
          <ellipse cx="52" cy="34" rx="11" ry="13" fill="currentColor"/>
          <circle cx="52" cy="17" r="6.5" fill="currentColor"/>
          <path d="M45 16c1-9 9-14 18-7-5 0-7 3-6 8z" fill="currentColor"/>
          <g transform="translate(60 10)"><g class="nb-pom"><circle cx="4" cy="-1" r="3.2" fill="#E8B866"/></g></g>
          <path d="M45 20c1 7 13 7 14 0" fill="#E8B866" opacity=".9"/>
          <!-- braço que segura as rédeas -->
          <path d="M60 31L66 37L68 37.5" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="68.4" cy="37.6" r="2.4" fill="#E8B866"/>
          <circle class="nb-anchor-hand" cx="68.4" cy="37.6" r=".6" fill="currentColor" opacity="0"/>
          <!-- braço que acena -->
          <g transform="translate(60 27)"><g class="nb-arm">
            <path d="M0 0L8 2L12 -7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12.4" cy="-8.4" r="2.6" fill="#E8B866"/>
          </g></g>
        </g>
      </g>
    </svg>
  </div>

  <div class="natal-banner__content">
    <span class="natal-banner__kicker">Natal</span>
    <h2 class="natal-banner__title">Edição especial de Natal</h2>
    <p class="natal-banner__desc">Panetones artesanais para presentear e celebrar em família.</p>
  </div>

`;
