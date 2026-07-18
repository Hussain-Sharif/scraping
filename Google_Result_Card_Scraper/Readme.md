# Google Result Card Scraper

A TypeScript scraper built for the [SerpApi Extract Van Gogh Paintings code challenge](https://github.com/serpapi/code-challenge).

The project reads saved Google Search HTML, extracts result-card data, and writes the results to JSON. Although the original challenge focuses on Van Gogh paintings, the extraction strategy was also checked against Picasso, Monet (French locale), and Power cast fixtures.

## Challenge

The original code challenge provides a Google Search HTML fixture and asks for structured extraction of the result cards. The expected data shape contains:

```ts
interface Painting {
  name: string;
  extensions: string[];
  link: string;
  image: string;
}
```

The repository for the original challenge is:

- https://github.com/serpapi/code-challenge

## Features

- Parses saved HTML files locally with Cheerio
- Extracts the result-card name, extension text, link, and image
- Handles both relative and absolute Google Search links
- Resolves deferred/lazy-loaded base64 images stored in inline script tags
- Preserves regular `src` images when no deferred-image mapping exists
- Uses fixtures from multiple result layouts and locales
- Includes unit and integration tests with Jest

## Tech Stack

- TypeScript
- Node.js
- Cheerio
- Jest

## Project Structure

```text
src/
  index.ts                         # Runs scraping jobs for local fixtures
  scraper.ts                       # Extraction and helper functions
  types.ts                         # Shared TypeScript types

fixtures/
  van-gogh-paintings.html
  pablo_picasso_paintings.html
  monet_paintings_fr.html
  power_cast.html

tests/
  scraper.unit.test.ts             # Tests helper functions in isolation
  scraper.integration.test.ts      # Tests complete extraction on fixtures

json_outputs/
  van-gogh-paintings-extracted.json
  pablo_picasso_paintings-extracted.json
  monet_paintings_fr-extracted.json
  power_cast-extracted.json
```

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Hussain-Sharif/scraping.git
cd Google_Result_Card_Scraper
npm install
```

## Running the Scraper

Run the project entry point:

```bash
npm run start
```

`index.ts` currently runs the scraper against four local HTML fixtures and writes a JSON output file for each one.

If the project does not have a `start` script yet, run the TypeScript entry point using the command configured by your project, for example:

```bash
npx tsx src/index.ts
```

## Running Tests

Run all Jest tests:

```bash
npm test
```

Optionally, check TypeScript compilation without generating JavaScript output:

```bash
npx tsc --noEmit
```

## Extraction Strategy

### 1. Parse local HTML

The scraper reads a saved HTML fixture with `fs.readFileSync()` and loads it into Cheerio.

```ts
const html = fs.readFileSync(path, "utf-8");
const $ = cheerio.load(html);
```

Using saved HTML makes the solution deterministic. The scraper does not make a live request to Google, so the same fixture can be reused in development and tests.

### 2. Identify result cards structurally

Google-generated class names are often obfuscated and can change between pages. Instead of depending on class names, the scraper identifies cards using stable structural signals:

- An anchor (`<a>`) element
- An image inside the anchor
- Nested `<div>` elements containing the title and extension text
- A Google Search-style `href`
- A `stick` parameter in the link, which identifies this result-card style

Conceptually, the target structure looks like this:

```html
<a href="/search?...&stick=...">
  <img ...>
  <div>
    <div>Result name</div>
    <div>Extension text</div>
  </div>
</a>
```

This approach is more resilient than selecting a short-lived Google CSS class.

### 3. Extract name and extension

The title is resolved with a fallback strategy:

1. Use the image `alt` attribute when present.
2. Otherwise use the text from the first nested `<div>`.

The second nested `<div>` becomes the first value in `extensions`.

For painting fixtures, this usually represents a year such as `1889`. The Power cast fixture demonstrates why the scraper treats it as text rather than enforcing a four-digit year: the same card structure can contain a different extension value.

```ts
{
  name: "The Starry Night",
  extensions: ["1889"]
}
```

### 4. Resolve Google links

Google result cards may use either:

- A relative link such as `/search?q=...`
- An absolute link such as `https://www.google.com/search?q=...`

The scraper prefixes the Google domain only for relative links. This prevents malformed double-domain URLs.

```ts
/search?q=The+Starry+Night
```

becomes:

```ts
https://www.google.com/search?q=The+Starry+Night
```

### 5. Resolve normal and deferred images

Some Google result-card images are directly available in an image element through either:

```html
<img data-src="https://example.com/image.jpg">
```

or:

```html
<img src="https://example.com/image.jpg">
```

However, some images are lazy-loaded. In that case, the `<img>` element initially contains a one-pixel placeholder GIF:

```html
<img
  id="image-id"
  src="data:image/gif;base64,..."
  data-deferred="1"
>
```

The actual base64 image is stored separately in an inline script. The script associates an image data string with one or more image IDs:

```js
var s = 'data:image/jpeg;base64,...';
var ii = ['image-id'];
_setImagesSrc(ii, s);
```

The scraper solves this in two stages:

1. Scan relevant `<script>` tags and build an ID-to-image lookup map.
2. When an `<img>` has a placeholder GIF, use its `id` to retrieve the actual base64 image from that map.

The intended priority order is:

1. `data-src`
2. Deferred image mapped by ID, but only when `src` is a placeholder GIF
3. Regular `src`
4. Empty string when no image is available

This prevents replacing valid normal image URLs unnecessarily.

## Testing Strategy

The project uses two levels of tests.

### Unit Tests

Unit tests cover the small helper functions independently:

- `buildDeferredImageMap`
  - Maps every image ID in a script's `ii` array to the correct base64 image
  - Returns an empty map when no matching script exists
- `resolveImage`
  - Prefers `data-src`
  - Replaces a placeholder GIF using the deferred-image map
  - Falls back to a normal `src` when no map entry exists
- `resolveLink`
  - Prefixes relative Google URLs
  - Does not duplicate the domain for absolute URLs
- `resolveName`
  - Prefers `img[alt]`
  - Falls back to the first nested text container

### Integration Tests

Integration tests run `extractPaintings()` against complete HTML fixtures:

- Van Gogh: verifies the expected first card and checks that the first deferred images are not placeholder GIFs
- Picasso: verifies that the same card structure is extracted from another painting search
- Monet French: verifies that the scraper handles locale variation without relying on English-only text
- Power cast: verifies that the extraction logic supports the same card structure even when the extension is descriptive text rather than a year

## Known Limitations

This is an HTML-fixture parser, not a production Google crawler.

- Google can change its HTML structure, attributes, and inline JavaScript format at any time.
- The card selector is intentionally based on the current fixture structure; a major layout change would require selector updates.
- Deferred-image extraction expects the observed `var s`, `var ii`, and `_setImagesSrc` script pattern.
- Base64 images can make output JSON files very large.

## Possible Improvements

- Accept input and output paths as CLI arguments instead of keeping them in `index.ts`
- Replace `console.log` with a logger or remove debugging output
- Add schema validation for the final JSON
- Add snapshot tests or exact expected-output fixtures for all supported pages
- Make the selector strategy configurable for other Google card layouts
- Add error handling for missing/unreadable files

## Attribution

This project was created as a solution for the [SerpApi Extract Van Gogh Paintings code challenge](https://github.com/serpapi/code-challenge).

Additional fixture variations used during testing include Picasso, Monet, and Power cast result pages to validate that the extraction strategy handles variation in result data and locale.