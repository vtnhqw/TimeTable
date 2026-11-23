# Timetable Wallpaper

Turn a timetable image into an editable schedule and a phone wallpaper. Includes a warm neutral and green interface, Lucide icons, class editing, color customization, and PNG export.

## Add your API key

A `.env.local` file is ready in the project root. Open it and set:

```dotenv
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

Get a key at https://aistudio.google.com/api-keys. Never prefix this key with `NEXT_PUBLIC_`. `.env.local` is ignored by Git. `.env.example` is a shareable blank template. If deploying, set these variables in your host's server environment settings instead. Restart the server after changing configuration.

```sh
npm install
npm run dev
```

Open http://localhost:3000. API setup is server-only and is never shown on the customer page. If extraction is unavailable, customers see a short retry/manual-entry message. Manual entry, the sample schedule, styling, and export work without a key. Google's free tier has model-specific limits; verify your project's quota and model access in AI Studio.

## How extraction works

The browser validates and decodes the image, preserves the full image, and converts it to JPEG with bounded dimensions (4096 pixels per side, at most 6 million pixels). PNG, JPEG, WebP, AVIF, GIF and BMP inputs up to 20 MB are accepted when supported by the browser. Animated images use one frame. Export HEIC/PDF to an image first.

`POST /api/extract` sends the prepared image to Gemini using a server-only key. Structured JSON is checked against the app's class schema. Invalid sessions are skipped with warnings; exact duplicates are removed. The original image stays available in the review screen. Review all days, times, subjects, and rooms: AI can still miss or misread tiny, blurry, rotated, or unusual timetables. No system can guarantee correct results for every image.

The old Tesseract engine and coordinate/color-based timetable parsers were removed. Their OCR-only tests were replaced with API boundary tests and image preparation checks. The provided screenshot is retained as a preparation fixture; its expected schedule remains in `tests/fixtures/sample-expected.json` for live comparison once a real key is configured.

## Checks

Node 22.6+ is required for tests.

```sh
npm test
npm run lint
npm run format:check
npm run build
npm start
```

Automated API tests stub only the external Gemini HTTP response; they exercise the real upload handler, validation, provider error handling, deduplication and key handling. They do not prove live model recognition accuracy. No live Gemini request can be verified until a valid key is supplied.

## Privacy and deployment

Uploaded images pass through this app's server to Google Gemini. The app does not persist uploaded images on the server or log API keys. Google's free-tier terms may allow submissions to be used for product improvement. Classes and style choices are saved in sessionStorage in the browser; the original preview is held in memory. The API route limits upload size, enforces same-origin browser uploads, and times out provider calls. For public deployment, configure host-level rate limits or authentication to control usage of your project's API quota; same-origin checking is not authentication. Use a Node server, not a static export.

## Code layout

- `app/api/extract/route.ts`: image extraction endpoint.
- `lib/extraction/server.ts`: Gemini request, response validation, safe errors.
- `lib/extraction/client.ts`: image preparation, upload and cancellation.
- `lib/extraction/upload.ts`: file type and size validation.
- `components/`: upload, review, styling and export UI.
- `lib/schema.ts`, `storage.ts`, `render.ts`: data validation, browser session and wallpaper rendering.

## Interface checks

The header toggles website light/dark mode independently of the exported wallpaper theme. The site follows the device theme until a preference is saved. Phone previews share a live local clock and device frame; overlays are not baked into downloaded wallpapers.

With the site running at http://127.0.0.1:3000, use `npm run test:ui` to test mobile layouts, theme persistence, editing and PNG downloads. Run `npx playwright install chromium --only-shell` once to install the test browser.
# TimeTable
