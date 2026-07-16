import * as cheerio from 'cheerio';
import {Painting}  from './types';
import * as fs from 'fs'

function extractPaintings(path:string): Painting[] {
  const html = fs.readFileSync(path, 'utf-8');
  const $ = cheerio.load(html);
  const results: Painting[] = [];
  const domain = "https://www.google.com"


  const items = $('a').filter((_ , el)=>{ // filtering anchor tags which has img tag and at least 2 divs as direct descendants
      const $eachAnchor = $(el);
      return $eachAnchor.find('img').length > 0 && $eachAnchor.find('div > div').length >= 2 && ($eachAnchor.attr("href")?.startsWith("/search") ?? false) && ($eachAnchor.attr("href")?.includes("stick")!==undefined ? true :false);  
  }) 

  console.log("total: Actual Anchor items:",items.length)
  
  items.each((_,el)=>{
    const $eachAnchor = $(el);
    const container_holds_divs = $eachAnchor.find('div > div'); // finding div which has divs as direct descendants

    
    let name="", year="";
    (container_holds_divs.length===2) 
    && 
    (name = $eachAnchor.find("img")?.attr("alt") ?? "", 
    year = $(container_holds_divs[1]).text().trim())
    

    const extensions = [year];

    const link = $eachAnchor.attr("href")!==undefined ? domain + $eachAnchor.attr("href") : ""
    const image = $eachAnchor.find("img")?.attr("data-src") ?? $eachAnchor.find("img")?.attr("src") ??  ""
    results.push({
      name,
      extensions,
      link ,
      image
    })
  })

  return results;
}


export function scrapePaintingAndSaveToFile(inputPath: string, outputPath: string): void {
  const finalJson=extractPaintings(inputPath)

  fs.writeFile(outputPath, JSON.stringify(finalJson, null, 4), 'utf-8',(err):undefined =>{
    if(err){
      console.log("Error writing to file:", err);
      return;
    }
    console.log(`Data successfully written to ${outputPath}`);
  });

}

scrapePaintingAndSaveToFile('/home/sharifdev/projects/my/scraping/scraping-1/fixtures/van-gogh-paintings.html', '/home/sharifdev/projects/my/scraping/scraping-1/json_outputs/van-gogh-paintings-extracted.json')