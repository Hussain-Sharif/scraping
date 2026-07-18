import {describe, it, expect} from '@jest/globals'

import path from "path";
import { extractPaintings } from "../src/scraper.js";

const fixture = (filename: string) =>
  path.join(process.cwd(), "fixtures", filename);

describe("extractPaintings", () => {
  it("extracts Van Gogh paintings with actual images", () => {
    const paintings = extractPaintings(
      fixture("van-gogh-paintings.html")
    );

    expect(paintings.length).toBeGreaterThanOrEqual(3);

    expect(paintings[0]).toMatchObject({
      name: "The Starry Night",
      extensions: ["1889"],
    });

    for (const painting of paintings.slice(0, 8)) {
      expect(painting.link).toMatch(
        /^https:\/\/www\.google\.com\/search/
      );
      expect(painting.image).toMatch(/^data:image\/|^https?:\/\//);
      expect(painting.image).not.toMatch(/^data:image\/gif/);
    }
  });

  it("extracts Picasso cards", () => {
    const paintings = extractPaintings(
      fixture("pablo_picasso_paintings.html")
    );

    expect(paintings.length).toBeGreaterThanOrEqual(3);

    for (const painting of paintings.slice(0, 3)) {
      expect(painting.name).not.toBe("");
      expect(painting.extensions?.[0]).not.toBe("");
      expect(painting.link).toMatch(
        /^https:\/\/www\.google\.com\/search/
      );
      expect(painting.image).not.toMatch(/^data:image\/gif/);
    }
  });

  it("extracts French Monet cards", () => {
    const paintings = extractPaintings(
      fixture("monet_paintings_fr.html")
    );

    expect(paintings.length).toBeGreaterThanOrEqual(3);

    for (const painting of paintings.slice(0, 3)) {
      expect(painting.name).not.toBe("");
      expect(painting.extensions?.[0]).not.toBe("");
      expect(painting.link).toMatch(
        /^https:\/\/www\.google\.com\/search/
      );
    }
  });

  it("extracts power-cast cards without assuming extensions are years", () => {
    const records = extractPaintings(fixture("power_cast.html"));

    expect(records.length).toBeGreaterThanOrEqual(3);

    for (const record of records.slice(0, 3)) {
      expect(record.name).not.toBe("");
      expect(record.extensions?.[0]).not.toBe("");
      expect(record.image).not.toMatch(/^data:image\/gif/);
    }
  });
});