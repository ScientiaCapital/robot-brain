# Robot Brain - Project Context

**Last Updated**: 2025-11-27

## Current Status: LANDING PAGE COMPLETE ✨

### Stack
| Service | Provider | Status |
|---------|----------|--------|
| Database | **Supabase** | ✅ Configured |
| TTS Voice | **Cartesia** (sonic-2) | ✅ Integrated |
| Chat AI | **Anthropic Claude** | ✅ Working |
| Chinese LLMs | **OpenRouter** | ✅ Available |
| Framework | **Next.js 15.4.5** | ✅ Building |

### Routes
- `/` - NEW playful landing page
- `/chat` - VoiceFirstChat interface
- `/api/chat` - Anthropic Claude conversations
- `/api/health` - System health monitoring
- `/api/openrouter` - Chinese LLMs
- `/api/voice/text-to-speech` - Cartesia TTS

## Completed Today (2025-11-27)

### Landing Page (Onyx-inspired)
Created 5 new components in `ui/src/components/landing/`:
- `HeroSection.tsx` - Animated hero with floating emoji
- `FeaturesGrid.tsx` - 6 emoji feature cards
- `DemoWidget.tsx` - Interactive 5-message demo
- `CTASection.tsx` - Final call-to-action
- `LandingFooter.tsx` - Dark footer with trust badges

### Styling Updates
- `tailwind.config.ts` - Playful color palette + animations
- `globals.css` - Landing gradients, feature cards, CTA buttons
- Custom animations: float, sparkle, glow-pulse, wave

### Route Changes
- `/` now shows landing page (was VoiceFirstChat)
- `/chat` new route for VoiceFirstChat

## Tomorrow's Tasks

1. **Deploy to Vercel** - Push landing page live
2. **Test Demo Widget** - Verify API calls work in production
3. **Mobile Testing** - Check responsive design on real devices
4. **Voice Mode** - Test Cartesia TTS on `/chat` page
5. **Optional** - Add social proof / testimonials section

## Key Files Changed

| File | Change |
|------|--------|
| `ui/src/app/page.tsx` | Landing page composition |
| `ui/src/app/chat/page.tsx` | NEW - Chat route |
| `ui/src/components/landing/*` | NEW - 5 components |
| `ui/tailwind.config.ts` | Playful theme |
| `ui/src/app/globals.css` | Landing styles |

## Notes

- **NO OpenAI** - Project policy
- **Build Status** - ✅ Passing
- Demo widget connects to `/api/chat` successfully
