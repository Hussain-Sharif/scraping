import {describe, it, expect} from '@jest/globals'

import * as cheerio from "cheerio";
import {
  buildDeferredImageMap,
  resolveImage,
  resolveLink,
  resolveName,
} from "../src/scraper";

describe("buildDeferredImageMap", () => {
  it("maps every image id to its deferred base64 image", () => {
    const $ = cheerio.load(`
      <script>
        var s='data:image/jpeg;base64,REAL_IMAGE';
        var ii=['image-one', 'image-two'];
        _setImagesSrc(ii, s);
      </script>
    `);

    expect(buildDeferredImageMap($)).toEqual({
      "image-one": "data:image/jpeg;base64,REAL_IMAGE",
      "image-two": "data:image/jpeg;base64,REAL_IMAGE",
    });
  });

  it("returns an empty map when no deferred-image script exists", () => {
    const $ = cheerio.load("<html><body>No script here</body></html>");

    expect(buildDeferredImageMap($)).toEqual({});
  });
});

describe("resolveImage", () => {
  it("prefers data-src when it exists", () => {
    const $ = cheerio.load(`
      <a>
        <img
          id="painting-image"
          src="data:image/gif;base64,PLACEHOLDER"
          data-src="https://example.com/painting.jpg"
        >
      </a>
    `);

    expect(resolveImage($("a"), {}))
      .toBe("https://example.com/painting.jpg");
  });

  it("replaces a placeholder gif using its deferred image id", () => {
    const $ = cheerio.load(`
      <a>
        <img
          id="painting-image"
          src="data:image/gif;base64,PLACEHOLDER"
        >
      </a>
    `);

    expect(
      resolveImage($("a"), {
        "painting-image": "data:image/jpeg;base64,REAL_IMAGE",
      })
    ).toBe("data:image/jpeg;base64,REAL_IMAGE");
  });

  it("keeps a normal src when no deferred mapping exists", () => {
    const $ = cheerio.load(`
      <a>
        <img
          id="painting-image"
          src="https://example.com/painting.jpg"
        >
      </a>
    `);

    expect(resolveImage($("a"), {}))
      .toBe("https://example.com/painting.jpg");
  });
});

describe("resolveLink", () => {
  const domain = "https://www.google.com";

  it("prefixes a relative Google search link", () => {
    const $ = cheerio.load(`<a href="/search?q=Starry+Night"></a>`);

    expect(resolveLink($("a"), domain))
      .toBe("https://www.google.com/search?q=Starry+Night");
  });

  it("does not duplicate the domain for an absolute link", () => {
    const $ = cheerio.load(
      `<a href="https://www.google.com/search?q=Starry+Night"></a>`
    );

    expect(resolveLink($("a"), domain))
      .toBe("https://www.google.com/search?q=Starry+Night");
  });
});

describe("resolveName", () => {
  it("uses img alt before the text in the first nested div", () => {
    const $ = cheerio.load(`
      <a>
        <img alt="The Starry Night">
        <div>
          <div>Wrong name</div>
          <div>1889</div>
        </div>
      </a>
    `);

    const $anchor = $("a");
    expect(resolveName($, $anchor, $anchor.find("div > div")))
      .toBe("The Starry Night");
  });

  it("uses the first nested div when alt is unavailable", () => {
    const $ = cheerio.load(`
      <a>
        <img>
        <div>
          <div>
            The Starry Night
          </div>
          <div>1889</div>
        </div>
      </a>
    `);

    const $anchor = $("a");
    expect(resolveName($, $anchor, $anchor.find("div > div")))
      .toBe("The Starry Night");
  });
});