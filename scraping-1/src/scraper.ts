import * as cheerio from 'cheerio';
import {Painting}  from './types';
import * as fs from 'fs'

// console.log("123654789")
export function extractPaintings(path:string): Painting[] {
  const html = fs.readFileSync(path, 'utf-8');
  const $ = cheerio.load(html);
  const results: Painting[] = [];

  $('.iELo6').each((_, el) => {
  let name = $(el).find('.pgNMRc').text().trim().replace("\n","");
  const fullname=name.split(" ")[0]+name.split(" ")[name.split(" ").length-1]; 
  const yearText = $(el).find('.cxzHyb').text().trim();
  const extensions = yearText ? [yearText] : [];
  const link = $(el).find('a').attr('href') ?? '';
  const thumbnail = $(el).find('img').attr('src') ?? '';

  if (name) {
    results.push({ name,fullname, extensions, link, thumbnail });
  }
});

  return results;
}

console.log(extractPaintings('/home/sharifdev/projects/my/scraping/scraping-1/fixtures/van-gogh-paintings.html'))