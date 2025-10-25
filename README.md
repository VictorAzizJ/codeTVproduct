# 📚 Study Checkout - Chrome Extension

Turn online shopping into a learning opportunity! Study Checkout is a Chrome extension that prompts you with educational quiz questions before allowing you to complete your purchases.

## 🎯 Features

- **Automatic Checkout Detection**: Detects when you're on a checkout page across any e-commerce site
- **AI-Generated Questions**: Uses OpenRouter API to generate personalized quiz questions
- **Customizable Learning**: Choose from different subjects (Math, Science, History, etc.) and difficulty levels
- **Study Mode**: Add custom prompts to study for specific topics or exams
- **Beautiful UI**: Clean, modern interface that doesn't disrupt your shopping experience

## 🚀 Installation

### 1. Get an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Sign up for an account
3. Create a new API key
4. Copy the API key (starts with `sk-or-...`)

### 2. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right corner)
3. Click "Load unpacked"
4. Select the folder containing this extension
5. The extension should now appear in your extensions list

### 3. Configure the Extension

1. Click on the extension icon in your Chrome toolbar
2. Click "Open Settings"
3. Enter your OpenRouter API key
4. Choose your preferred AI model (GPT-3.5 Turbo is recommended for speed and cost)
5. Select your question type and difficulty level
6. Click "Save Settings"

### 4. Add Icons (Optional)

For a polished look, add three icon files to the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

See `icons/README.txt` for more details.

## 🎮 How to Use

1. **Shop as Normal**: Browse any e-commerce website
2. **Proceed to Checkout**: When you reach a checkout page, the extension will automatically detect it
3. **Answer the Question**: A quiz modal will appear, blocking the checkout
4. **Get It Right**: Answer correctly to unlock checkout and complete your purchase
5. **Learn Something New**: Even if shopping wasn't productive, at least you learned something!

## ⚙️ Configuration Options

### Question Types
- **General Knowledge**: Broad range of topics
- **Fun Trivia**: Entertainment and pop culture
- **Mathematics**: Math problems and equations
- **Science**: Biology, Chemistry, and Physics
- **History**: Historical events and figures
- **Geography**: Countries, capitals, and landmarks
- **Language**: Vocabulary and grammar

### Difficulty Levels
- **Easy**: Simple questions with straightforward answers
- **Medium**: Moderate difficulty (default)
- **Hard**: Challenging questions requiring deeper knowledge

### Custom Prompts
Want to study for a specific exam or topic? Add a custom prompt like:
- "Ask me Spanish vocabulary words for beginners"
- "Quiz me on World War 2 history"
- "Give me Python programming questions"
- "Test my knowledge of human anatomy"

### AI Models
Choose from various models on OpenRouter:
- **GPT-3.5 Turbo**: Fast, affordable, great for most use cases (recommended)
- **GPT-4**: Most accurate, higher cost
- **Claude 3 Haiku**: Fast and efficient
- **Claude 3 Sonnet**: Balanced performance
- **Llama 3 8B**: Budget-friendly option

Check [OpenRouter pricing](https://openrouter.ai/docs#models) for cost details.

## 🧪 Testing

Want to test the extension without waiting for a checkout page?

1. Click the extension icon
2. Click "Test on This Page"
3. The quiz modal will appear immediately

## 📁 Project Structure

```
study-checkout/
├── manifest.json          # Extension configuration
├── content.js            # Detects checkout pages and shows quiz
├── background.js         # Handles OpenRouter API calls
├── quiz-modal.css        # Styling for the quiz interface
├── options.html          # Settings page UI
├── options.js            # Settings page logic
├── popup.html            # Extension popup UI
├── popup.js              # Extension popup logic
├── icons/                # Extension icons
│   └── README.txt        # Icon requirements
└── README.md             # This file
```

## 🔧 Development

### Adding New Question Types

Edit `background.js` and add a new case to the `buildPrompt()` function:

```javascript
case 'your-topic':
  basePrompt = 'Generate a question about your topic';
  break;
```

Then add the option to `options.html`:

```html
<option value="your-topic">Your Topic</option>
```

### Customizing Checkout Detection

Edit the `CHECKOUT_PATTERNS` array in `content.js` to add more URL patterns:

```javascript
const CHECKOUT_PATTERNS = [
  /checkout/i,
  /your-pattern/i,
  // ... more patterns
];
```

## 🐛 Troubleshooting

### Extension Doesn't Detect Checkout Pages

- The checkout detection looks for common patterns in URLs and page content
- You can test the extension manually using the "Test on This Page" button
- Consider adding site-specific patterns to `CHECKOUT_PATTERNS` in `content.js`

### API Key Errors

- Ensure your API key starts with `sk-or-`
- Check that you have credits in your OpenRouter account
- Verify the API key is correctly saved in settings

### Questions Not Loading

- Check your internet connection
- Verify your OpenRouter API key is valid
- Check the Chrome DevTools console for error messages (F12)
- Try a different AI model in settings

### Modal Not Appearing

- Check that the extension is enabled in `chrome://extensions/`
- Try reloading the page
- Check for JavaScript errors in the console (F12)

## 💡 Tips

- **Set Difficulty Based on Goals**: Use "Easy" for casual learning, "Hard" for serious study
- **Use Custom Prompts for Exams**: Studying for a test? Add a custom prompt with your exam topics
- **Try Different Models**: Each AI model has different strengths - experiment to find your favorite
- **Budget Conscious?**: Use GPT-3.5 Turbo or Llama 3 for lower costs
- **Track Your Spending**: Monitor your OpenRouter dashboard to see API usage

## 🤝 Contributing

This is your project! Feel free to:
- Add new features
- Improve checkout detection
- Add more question types
- Enhance the UI/UX
- Fix bugs

## 📄 License

This project is open source and available for personal use.

## 🎓 Use Cases

- **Students**: Study while treating yourself to online shopping
- **Language Learners**: Practice vocabulary before impulse purchases
- **Impulse Control**: Add friction to checkout to reduce impulsive buying
- **Lifelong Learners**: Turn every purchase into a micro-learning moment
- **Test Prep**: Custom prompts for SAT, GRE, or certification exams

## 🔒 Privacy

- Your API key is stored locally in Chrome's sync storage
- No data is sent anywhere except to OpenRouter for question generation
- The extension only activates on checkout pages
- No tracking or analytics

## 📞 Support

Having issues? Here are some resources:
- Check the Troubleshooting section above
- Review [OpenRouter Documentation](https://openrouter.ai/docs)
- Check Chrome Extension Developer docs

---

Made with ❤️ for learners who can't stop shopping (or shoppers who can't stop learning)
