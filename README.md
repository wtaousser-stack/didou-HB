# didou-HB — iPhone PWA

A mobile-first fitness tracker that can be hosted as a static site on GitHub Pages.

## Features
- Daily steps estimate using device motion while the page is open and permitted
- Running/walking timer, optional distance, estimated workout calories
- Weight update and first milestone display
- Simple daily food plan
- Product photo preview and label-based rule-of-thumb review
- Local workout history stored in this browser on this device
- PWA manifest and offline cache

## Important limitations
- This is a prototype, not a medical device.
- iOS Safari/PWAs cannot reliably collect steps continuously in the background or directly read Apple Health/HealthKit. Motion estimates only work while the page is active and sensor permission is granted.
- Product photos are previewed only. The product checker uses nutrition details you type; automatic image understanding needs an AI backend/API integration.
- Data is stored in local browser storage. It is not synced across devices and can be lost if website data is cleared.
- Calorie estimates are approximate.

## Publish on GitHub Pages
1. Sign in to GitHub and create a new **public** repository, for example `didou-hb`.
2. Upload all files from this folder to the repository root (`index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`, `icon.svg`, `README.md`).
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
5. Wait for GitHub Pages to publish your site. The address will look like `https://YOUR-USERNAME.github.io/didou-hb/`.
6. On your iPhone 14 Pro Max, open that URL in **Safari**, tap **Share**, then **Add to Home Screen**.

## Notes
- For the offline cache to install, register the service worker by adding this snippet before `</body>` in `index.html`:
  ```html
  <script>if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));</script>
  ```
- A more advanced version could integrate Apple HealthKit through a native iOS app, and a secure server-side AI service for product-photo analysis. Do not put private API keys in frontend code or a public GitHub repository.
