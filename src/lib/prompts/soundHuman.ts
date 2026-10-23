/**
 * The figures that make a post read as machine-written, as writing rules.
 * The writer and the variants stage both get them; src/lib/drafts/slop.ts
 * finds the same figures in the finished draft and rewrites it once when
 * they are still there.
 */
export const SOUND_HUMAN = `- At most ONE "it isn't X, it's Y" / "not X, but Y" / "X, not Y" figure in the whole piece. Say every other point directly.
- No runs of tiny sentences for effect ("No alert. No follow-up. No trace."), and no back-to-back sentences opening on the same word for rhythm ("Not when... Not when... Only when...").
- Lists of three only where there really are three things; usually name one or two.
- Do not end on a one-line maxim ("The backend is the truth."). End on something specific: what the author would check first, what they are still unsure about, or a real question for peers.
- Plain words over stock phrasing: never 'crucial', 'pivotal', 'underscore', 'foster', 'serves as', 'landscape', 'robust', 'leverage', 'unlock', 'here's the thing', 'the reality is'.
- Words, not arrows or symbols ('→', '≈', '✅').
- Contractions where people use them when they talk ('I'm', 'it's', 'don't', 'that's'), unless the tone profile says formal.`;
