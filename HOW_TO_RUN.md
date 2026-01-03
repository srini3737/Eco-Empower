# How to Run Empathy Green / Eco Empower

This is a static HTML/CSS/JS website. You can run it using any simple HTTP server.

## Option 1: Python HTTP Server (Recommended)
If you have Python installed (which you likely do), you can run the following command in the project root directory:

```bash
python -m http.server 8000
```

Then open your browser to: [http://localhost:8000](http://localhost:8000)

## Option 2: VS Code Live Server
If you are using VS Code:
1. Install the "Live Server" extension by Ritwick Dey.
2. Right-click on `index.html`.
3. Select "Open with Live Server".

## Option 3: Double Click
You can simply double-click `index.html` to open it in your browser. However, some features (like `auth.js` or `wallet.js` if they use certain browser APIs) might work better when served over HTTP/HTTPS rather than `file://` protocol.
