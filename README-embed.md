# Embedding the Alvin Helpdesk Chat Widget

This guide shows you how to build and embed the Alvin Helpdesk Chat Widget as a standalone drop-in widget on any website or React application.

---

## 1. Build the Widget Bundle

Ensure you have built the UMD bundle (JS + CSS) using Rollup:

```bash
npm install
npm run build:embed
```

This will generate:

- `dist/widget.umd.js`
- `dist/widget.umd.css`

Upload these files to your static hosting or CDN (e.g. AWS S3, Cloudflare, Vercel Static, etc.). Note their public URLs:

- `https://cdn.example.com/alvin-helpdesk/widget.umd.js`
- `https://cdn.example.com/alvin-helpdesk/widget.umd.css`

---

## 2. Include in Your Host Page

In the `<head>` of your page, include the CSS:

```html
<link rel="stylesheet" href="https://cdn.example.com/alvin-helpdesk/widget.umd.css">
```

Before the closing `</body>`, include the JS bundle:

```html
<script src="https://cdn.example.com/alvin-helpdesk/widget.umd.js"></script>
```

---

## 3. Initialize the Widget

Add a container `<div>` where you want the chat widget to render:

```html
<div id="alvin-helpdesk-container"></div>
```

After the script tag, call the global initializer:

```html
<script>
  window.initAlvinHelpdesk({
    containerId: 'alvin-helpdesk-container',
    apiBase: 'https://your-domain.com/api/v1/chat',
    suggestionsBase: 'https://your-domain.com/api/v1/suggestions',
    theme: 'light',      // 'light' or 'dark'
    // any other props supported by ChatWidget
  });
</script>
```

### Options

- `containerId` **(required)**: ID of the `<div>` where the widget mounts.
- `apiBase` **(required)**: Base URL for the chat API endpoint.
- `suggestionsBase` **(optional)**: URL for suggestions route (if used).
- `theme` **(optional)**: `'light'` or `'dark'` theme override.
- Additional props passed through to the React `ChatWidget` component.

---

## 4. Embedding in React Apps

If you prefer importing as a module in a React app:

```bash
npm install https://cdn.example.com/alvin-helpdesk/widget.umd.js
```

```js
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
// The UMD bundle will attach AlvinHelpdeskWidget to window

function EmbeddedChat() {
  useEffect(() => {
    window.initAlvinHelpdesk({
      containerId: 'alvin-react-chat',
      apiBase: '/api/v1/chat'
    });
  }, []);

  return <div id="alvin-react-chat"></div>;
}
```

---

## 5. Troubleshooting

- **Container not found**: Ensure `containerId` matches the `<div>` ID exactly.
- **Styles missing**: Verify the CSS link URL and that it’s loaded before initialization.
- **CORS/API errors**: Confirm your `apiBase` endpoint allows requests from your host domain.

---

That’s it! You can now embed the Alvin Helpdesk Chat Widget on any site with a simple script and link tag. Feel free to customize styling via your own site CSS or Tailwind overrides.
