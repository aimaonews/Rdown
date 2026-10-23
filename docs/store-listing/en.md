# Rdown — Chrome Web Store Listing (English)

> Paste into Chrome Web Store Developer Dashboard → Store listing → Language: English

## Value Proposition (Summary)

Rdown hands your browser downloads to the Rdown download manager on your own machine: multi-connection HTTP, BitTorrent & magnet, and m3u8/mpd streams — one-click capture, resume, and automatic fallback. Built for users who want fast, manageable, automatable downloads.

## Feature Sections

**Automatic Download Capture**
- Clicking a download link sends it to Rdown and seamlessly cancels the browser download; on failure it falls back to the browser so no download is ever lost
- Works on sites behind logins: Cookie / Referer / User-Agent are forwarded automatically

**Stream Sniffing & Downloads**
- Automatically discovers m3u8 / mpd / video / audio resources loaded by the page; one-click download from the popup
- Deep search scans page scripts for dynamically generated media URLs; quality selection and AES-128 decryption supported

**BitTorrent & Magnet**
- Click a magnet: link on any page to create a task instantly; automatic tracker updates; full DHT/LPD/PEX support

**Smart Filters & Automation**
- Three-level domain/extension/size allow & block lists; regex rules for sniffed media; filename templates (${title}/${host}/${date} and more)
- Optional auto-download of sniffed media; hold Alt to bypass capture once; Alt+Shift+D toggles capture

**Multi-Server & Integration**
- Route downloads to different Rdown servers by URL rules; remote instances with API token auth
- System notifications on completion/failure; badge shows active tasks and media count on the page

## Localized Graphic Assets Checklist

- [ ] Screenshot 1 (1280×800): Extension popup — capture toggle + page media list (English UI)
- [ ] Screenshot 2 (1280×800): Options page — filter rules and multi-server configuration (English UI)
- [ ] Screenshot 3 (1280×800): Rdown Web manager — task list (English, light mode)
- [ ] Screenshot 4 (1280×800): New task dialog — stream resolve & quality selection (English)
- [ ] Screenshot 5 (1280×800): Web manager in dark mode (English)
- [ ] Localized promo video (optional): none yet; if an English demo video is recorded, fill it in the English listing's Localized promo video field

## Privacy Note (append to store description)

This extension only sends the download URL you initiate and the HTTP request headers required for that request to your local Rdown service (127.0.0.1 by default; data never leaves your machine). No third-party data collection, no ads, no tracking. See the privacy policy for details.
