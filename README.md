# Shopping Debate - Chrome Extension

Three AI personalities debate your purchase decisions before checkout. Make thoughtful choices, not impulsive ones.

## The Personalities

**The Enabler** - Finds genuine value and benefits, creates vivid scenarios of how the purchase improves your life
**The Skeptic** - Raises practical questions, compares cost vs value, suggests alternatives
**The Mediator** - Synthesizes both perspectives, asks insightful questions, guides your decision

## Features

- **Real-Time AI Streaming**: Watch three personalities debate token-by-token (not simulated!)
- **Automatic Checkout Detection**: Triggers on checkout pages across any e-commerce site
- **Context-Aware Debates**: Each personality references actual product names and prices
- **"Yes, And..." Improv Style**: The Mediator builds upon specific arguments from both sides
- **Beautiful UI**: Gradient design with smooth animations
- **Multiple AI Models**: Choose from Claude, GPT-4, GPT-3.5, and more

## Quick Start

### 1. Get an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Sign up and create a new API key
3. Copy the key (starts with `sk-or-...`)
4. Free credits available for new users!

### 2. Install the Extension

```bash
# Open Chrome and go to:
chrome://extensions/

# 1. Enable "Developer mode" (top right)
# 2. Click "Load unpacked"
# 3. Select this extension folder
```

### 3. Configure Settings

1. Click the extension icon
2. Click "Open Settings"
3. Paste your OpenRouter API key
4. Choose AI model (Claude 3 Haiku recommended)
5. Save settings

### 4. Shop and Debate!

Visit any checkout page - the debate will start automatically!

## How It Works

```
You reach checkout
    ↓
Modal appears with product context
    ↓
Enabler streams their argument
    ↓
Skeptic streams their counterpoint
    ↓
Mediator synthesizes both views
    ↓
You decide: Proceed or Reconsider
```

## Testing

### Test Page Included

Open `test-checkout.html` in Chrome to see the extension in action!

### Manual Trigger

1. Click extension icon
2. Click "Test on This Page"
3. Debate starts immediately

## Configuration

### AI Models

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| Claude 3 Haiku | Fast | Good | Low | Recommended |
| Claude 3 Sonnet | Medium | Great | Medium | Balanced |
| GPT-3.5 Turbo | Fast | Good | Low | Fast & Cheap |
| GPT-4 | Slow | Excellent | High | Maximum Quality |
| Llama 3 8B | Medium | Good | Low | Budget |

Check [OpenRouter pricing](https://openrouter.ai/models) for current rates.

## Project Structure

```
shopping-debate/
├── dist/
│   └── background.bundle.js      # 545KB bundled with OpenRouter SDK (Beta)
├── src/
│   ├── background/
│   │   └── index.js              # Streaming orchestration
│   ├── content/
│   │   ├── index.js              # Debate modal + message handling
│   │   ├── checkout.js           # Checkout detection logic
│   │   └── debate-modal.css      # Gradient styling
│   ├── options/
│   │   ├── view.html             # Settings page
│   │   └── controller.js         # Settings logic
│   └── popup/
│       ├── view.html             # Extension popup
│       └── controller.js         # Popup logic
├── manifest.json                 # Extension config
├── package.json                  # Build scripts
├── test-checkout.html            # Test page
└── README.md                     # This file
```

## Development

### Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch mode (auto-rebuild)
npm run watch
```

### Workflow

1. Make changes to `src/background/index.js`
2. Run `npm run build` (or use watch mode)
3. Go to `chrome://extensions/` and click "Reload"
4. Test on checkout page or test-checkout.html

### Customizing Prompts

Edit the prompt builders in `src/background/index.js`:

```javascript
function buildEnablerPrompt(productContext) {
  // Customize Enabler's personality and approach
}

function buildSkepticPrompt(productContext) {
  // Customize Skeptic's arguments
}

function buildMediatorPrompt(productContext, previousResponses) {
  // Customize how Mediator synthesizes perspectives
}
```

### Customizing Checkout Detection

Edit `CHECKOUT_PATTERNS` in `src/content/checkout.js`:

```javascript
const CHECKOUT_PATTERNS = [
  /checkout/i,
  /your-custom-pattern/i,
  // Add more patterns
];
```

## Troubleshooting

### Modal Doesn't Appear

- Check extension is enabled at `chrome://extensions/`
- Verify URL contains checkout keywords
- Check DevTools console (F12) for errors
- Try "Test on This Page" button

### Streaming Not Working

- Verify API key starts with `sk-or-`
- Check OpenRouter credits at dashboard
- Test with different AI model
- Check network tab for streaming response

### Extension Loads But Settings Don't Save

- Check Chrome storage permissions in manifest
- Try resetting to defaults
- Check DevTools console for errors

### Text Appears All at Once (Not Streaming)

This shouldn't happen! If it does:
- Rebuild: `npm run build`
- Reload extension
- Check that OpenRouter SDK is in bundle

## Advanced Tips

### Reducing API Costs

- Use Claude 3 Haiku or GPT-3.5 Turbo
- Lower `max_tokens` in `src/background/index.js`
- Add debate cooldown to prevent rapid triggers

### Better Product Context

Enhance `extractProductContext()` in `src/content/index.js`:
- Add more price selectors
- Parse product descriptions
- Extract review ratings
- Calculate price per unit

### Adding a Fourth Personality

1. Add streaming call in `handleStreamingDebate()`
2. Create prompt builder function
3. Add personality card HTML in `createDebateModal()`
4. Update CSS with new personality colors

## Use Cases

**Impulse Control**
Add meaningful friction to checkout decisions

**Budget Management**
Second-guess purchases before committing

**Decision Training**
Learn to consider multiple perspectives

**Mindful Shopping**
Slow down and think before buying

**Value Assessment**
Practice evaluating cost vs benefit

## Privacy & Security

- API key stored in Chrome's encrypted storage
- No data sent except to OpenRouter
- No tracking or analytics
- No data collected or stored
- Open source - review the code!

## Future Enhancements

Ideas for v2.0:

- **Debate History**: Track past decisions and outcomes
- **Learning Mode**: Extension learns your values over time
- **Budget Tracking**: Integration with financial goals
- **Social Sharing**: Share interesting debates
- **A/B Testing**: Measure which personality is most persuasive
- **Voice Mode**: Hear the debate instead of reading it
- **Custom Personalities**: Create your own AI advisors

## Contributing

Feel free to:
- Fork and improve
- Submit pull requests
- Report bugs
- Suggest features
- Share your experiences

## License

MIT License - Free for personal and commercial use

## Acknowledgments

Built with:
- [OpenRouter SDK (Beta)](https://openrouter.ai/docs/quickstart) - Official OpenRouter SDK
- [OpenRouter API](https://openrouter.ai) - Multi-model AI access
- [esbuild](https://esbuild.github.io/) - Lightning-fast bundling

## Support

Need help?
- Check the Troubleshooting section above
- Review [OpenRouter docs](https://openrouter.ai/docs)
- Open an issue on GitHub

---

**Built for thoughtful shoppers who want to make better decisions**
