# GitHub Clone in VS Code 🚀

> A simple Chrome extension that adds a "Clone in VS Code" button to GitHub repositories for seamless one-click cloning.

[![GitHub stars](https://img.shields.io/github/stars/AdamAkhlaq/github-clone-in-vscode?style=social)](https://github.com/AdamAkhlaq/github-clone-in-vscode/stargazers)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/)

## ⭐ **Star this repository to stay updated on development progress!**

This project is under active development. Star it to get notified about releases and updates!

---

## 🎯 What it does

This Chrome extension seamlessly integrates with GitHub's interface by adding a **"Clone in VS Code"** button directly under the existing "Code" dropdown on repository pages. With one click, it opens the repository in Visual Studio Code using the `vscode://` URL protocol.

### ✨ Key Features

- 🎯 **One-click cloning** - No more copying URLs manually
- 🔗 **Native GitHub integration** - Blends perfectly with GitHub's UI
- ⚡ **Lightweight** - Minimal permissions, maximum functionality
- 🚫 **No popup clutter** - Simple button injection only
- 🔄 **SPA support** - Works with GitHub's navigation
- 🎨 **Native styling** - Matches GitHub's design language

---

## 🚀 How it works

1. **Visit any GitHub repository** (e.g., `github.com/owner/repo`)
2. **Click the "Code" dropdown** as usual
3. **See the new "Clone in VS Code" option** under HTTPS/SSH
4. **Click it** and VS Code opens with the clone dialog ready!

The extension generates a `vscode://vscode.git/clone?url=https://github.com/owner/repo.git` URL that VS Code recognizes and handles automatically.

---

## 🛠️ Technical Details

- **Framework**: TypeScript + Chrome Manifest V3
- **Architecture**: Single content script injection
- **Permissions**: Minimal - only `*://github.com/*`
- **Compatibility**: All Chromium-based browsers
- **VS Code**: Works with VS Code, VS Code Insiders, and forks

---

## 📦 Installation

### From Chrome Web Store (Coming Soon)

_Extension will be available on the Chrome Web Store once development is complete._

### For Developers (Current)

1. Clone this repository
2. Build the extension (instructions coming soon)
3. Load as unpacked extension in Chrome Developer Mode

---

## 🤝 Contributing

Interested in contributing? Great! Here's how you can help:

1. **⭐ Star the repository** to show your support
2. **🐛 Report bugs** by opening issues
3. **💡 Suggest features** via GitHub discussions
4. **🔧 Submit pull requests** for fixes and improvements

### Development Setup (Coming Soon)

Detailed development instructions will be added as the project progresses.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ❤️ Support the Project

If you find this extension useful:

- ⭐ **Star this repository** to help others discover it
- 🐛 **Report issues** to help improve the extension
- 📢 **Share it** with other developers who might find it useful

---
