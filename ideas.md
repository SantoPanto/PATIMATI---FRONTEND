# Pattymaty – UI Design Brainstorm

> **Context:** Mobile-first web prototype of a Turkish pet adoption & lost-pet tracking app. Built with React + TypeScript. Turkish language throughout. The generated UI mockups (warm earthy tones, rounded cards, paw motifs) are the ground-truth visual spec.

---

## Three Approaches

### Approach 1: "Patili Dünya" (Warm Earthy Comfort)
**Very Brief Intro:** A warm, cozy aesthetic inspired by earthy terracotta, cream, and soft amber tones. Rounded, friendly UI elements with paw-print motifs create a welcoming, trustworthy feel for pet lovers.
**Probability:** 0.75

### Approach 2: "Sahne Arka Planı" (Soft Minimal Pastel)
**Very Brief Intro:** Ultra-clean minimalist design with soft pastel backgrounds, generous whitespace, and subtle card elevations. Focus on breathing room and clarity.
**Probability:** 0.15

### Approach 3: "Gece Vardiyası" (Dark Compassion)
**Very Brief Intro:** A dark-themed interface with warm amber accents and glowing paw icons. Evokes nighttime searches and the urgency of finding lost pets, while remaining gentle and approachable.
**Probability:** 0.10

---

## Selected Approach: "Patili Dünya" (Warm Earthy Comfort)

### Design Movement
Neobrutalist-soft hybrid — combining the warmth of organic shapes with the clarity of modern UI systems. Inspired by Japanese kawaii design and Scandinavian hygge aesthetics.

### Core Principles
1. **Warmth first** — Every surface should feel inviting, like a cozy home where pets belong.
2. **Roundness everywhere** — Generous border-radius (16–24px) on all interactive elements creates approachability.
3. **Layered depth** — Soft shadows and cream-on-white stacking gives tactile, card-based depth.
4. **Paw language** — Paw prints, hearts, and organic shapes serve as decorative motifs throughout.

### Color Philosophy
| Token | Value | Intent |
|-------|-------|--------|
| Primary (Amber) | #D97706 (amber-600) | Main CTA, active states — warmth and energy |
| Secondary (Brown) | #78350F (amber-900) | Headings, emphasis — grounding and trust |
| Background | #FFFBF0 (warm cream) | Main surface — soft, natural, like parchment |
| Card Surface | #FFFFFF | Elevated content areas — clean contrast |
| Accent (Sage Green) | #65A30D (lime-600) | "Found" status, success — nature and hope |
| Danger (Terracotta) | #DC2626 (red-600) | "Lost" status — urgency without alarm |
| Muted Text | #92400E (amber-800 at 60%) | Secondary info — warm neutrality |

### Layout Paradigm
Mobile-first single-column scroll with a fixed bottom tab bar. Content cards stack vertically with generous spacing (16–24px gaps). The header is a sticky compact bar with logo + actions. No sidebars — everything is a full-width mobile canvas.

### Signature Elements
1. **Paw-stamp buttons** — Primary buttons feature a subtle paw icon alongside text.
2. **Organic card shadows** — Cards use layered soft shadows (`0 4px 24px rgba(120, 53, 15, 0.08)`) for a floating, tactile feel.
3. **Wavy section dividers** — Subtle organic wave shapes between major sections using cream-to-white transitions.

### Interaction Philosophy
- Buttons scale down to 0.97 on press (160ms ease-out) for tactile feedback.
- Cards lift on hover with a subtle shadow increase.
- Page transitions use slide-in from bottom (300ms, ease-out) to mimic native mobile navigation.
- Tab switches are instant (no animation) for perceived speed.

### Animation
- **Entrance:** Cards stagger in with 40ms delay per item, fading up from 8px below.
- **Buttons:** Scale 0.97 on :active, 160ms ease-out.
- **Tab switching:** Immediate, no transition — feels snappy and native.
- **Modals/Drawers:** Slide up from bottom, 250ms ease-out.
- **Toast notifications:** Slide in from bottom, 200ms ease-out.
- **Images:** Fade in on load with 200ms ease-out.
- All animations respect `prefers-reduced-motion`.

### Typography System
- **Display (Logo, Hero):** "Quicksand" — rounded, playful, friendly. Weight 700.
- **Headings:** "Nunito" — semi-bold headings, warm rounded terminals. Weights 600–700.
- **Body:** "Nunito" — regular for descriptions and labels. Weight 400.
- **Mono:** System monospace for code/IDs.

### Brand Essence
> **A warm digital home for every patili friend — helping Turkish pet lovers adopt, track, and reunite through technology.**
> Personality: Caring, Trustworthy, Playful

### Brand Voice
- **Headlines:** Warm and inviting — "Patili dostlar için daha iyi bir dünya" (A better world for pawed friends)
- **CTAs:** Action-oriented with emotion — "Bir dost kazan, bir hayat değişsin" (Gain a friend, a life changes)
- **Microcopy:** Helpful and gentle — "Kayıp bir dost mu arıyorsunuz?" (Looking for a lost friend?)

### Wordmark & Logo
A stylized paw print merged with a heart shape, using the primary amber color. The wordmark "Pattymaty" uses Quicksand Bold with a small paw dot replacing the first "i" dot.

### Signature Brand Color
**Warm Amber (#D97706)** — This is the unmistakable Pattymaty color, used for primary buttons, active states, and brand moments.
