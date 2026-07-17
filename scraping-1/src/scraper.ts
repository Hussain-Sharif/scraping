import * as cheerio from 'cheerio';
import {DeferredImageMap, Painting}  from './types';
import * as fs from 'fs'



function buildDeferredImageMap($:cheerio.CheerioAPI): Record<string, string> {
    // Find script tags which has base64 images 
    /*
    kay-Value pair => 
    key(string): id of the image, 
    value(string): base64 image data
    */
    const map:Record<string,string> = {};
  
    /*
    targeting & filtering the script elements with 
    `data:image/jpeg;base64...`
    `var ii.....`
    `_setImagesSrc` 
    as the JS content 
    */
    const scriptTags = $('script').filter((_,el)=>{
    const scriptContent = $(el).html() ?? "";
    return scriptContent.includes('data:image/jpeg;base64') 
    && scriptContent.includes('var ii') 
    && scriptContent.includes('_setImagesSrc');
  })
  // Ofcourse we get more key-value pair than needed but definitely with real one's

  scriptTags.each((i,el)=>{
    const eachScriptEleContent = $(el).html();

    if(eachScriptEleContent){
      
      // Regex extracton for image url
      const data = eachScriptEleContent?.match(/data:image\/[^']+/)?.[0] ?? ""
    

      const setOfIds= eachScriptEleContent?.match(/var\s+ii\s*=\s*\[([^\]]+)\]/)?.[1] ?? ""

      if(setOfIds.length===0){
        return;
      }

      const allArrayOfIds=setOfIds.split(",");

      for(let eachId of allArrayOfIds ){
        // Regex extracton for id of `ii` array , helps in mapping

        const id_string = eachId.replace("'","").replace("'","") ?? ""
        if(id_string.length===0){
          continue;
        }
        map[id_string.trim()] = data.trim()
      }
      

    }
  })
  
  // -------------------------------------
  // Testing:
  // console.log("total: scriptTags:",scriptTags.length, $(scriptTags[0]).html() ?? "No script content found")
  // console.log("regex for url:", $(scriptTags[0]).html()?.match(/data:image\/[^']+/)?.[0] ?? "No URL found")  
  // console.log("regex for id:", $(scriptTags[0]).html()?.match(/var\s+ii\s*=\s*\[([^\]]+)\]/) ?? "No URL found")
  // console.log("regex for id:", $(scriptTags[0]).html()?.match(/var\s+ii\s*=\s*\[([^\]]+)\]/)?.[1].replace("'","").replace("'","") ?? "No URL found")

  return map;
}


export function extractPaintings(path:string): Partial<Painting>[] {
  
  // Important Initials
  const html = fs.readFileSync(path, 'utf-8');
  const $ = cheerio.load(html);
  const results: Partial<Painting>[] = [];
  const domain = "https://www.google.com"
 
  /* 
  ---> Starting here:
  Scraping logic for extracting deferred Image urls which requires targeting script tags in the HTML Document 
  
  Considering that, created a MAP:
  kay-Value pair => 
  key: id of the image, 
  value: base64 image data 
  */
  const deferredImageMap = buildDeferredImageMap($)


  // filtering anchor tags which has img tag and at least 2 divs as direct descendants
  /*
  Targeting Anchor Elements:
  Which helps to focus on complete Item-wise
  where Each Anchor Descendants with two Elements: 
  1 -> Image Element
  1 -> DIV Element

  And the Above 1 -> DIV Element has 2 -> DIV Elements as Descendants, 
  which has name and  year respectively.
  */
  const items = $('a').filter((_ , el)=>{ 
      const $eachAnchor = $(el);
      const href = $eachAnchor.attr("href") ?? "";
      return $eachAnchor.find('img').length > 0 
      && $eachAnchor.find('div > div').length >= 2 
      && href.startsWith("/search") 
      && href.includes("stick")
  }) 

  console.log("total: Actual Anchor items:",items.length)
  
  // -------------------- Travel on the items -----------
  items.each((_,el)=>{
    const $eachAnchor = $(el);
    const container_holds_divs = $eachAnchor.find('div > div'); // finding div which has divs as direct descendants

    
    // Finding the name and year    
    let name="", year="";
    if(container_holds_divs.length<=2){
      /*
      Getting name:
      From "image -> alt" might be defined with name 
      else might be "empty string" 
      else might be "undefined"{Means "alt" attribute is not present in the image tag}

      if "undefined" try to get name from DIV-1 content  

      */
      const imageEle_Alt=$eachAnchor.find("img")?.attr("alt")
      name = (imageEle_Alt!==undefined 
             && imageEle_Alt.length>0 )
              ? imageEle_Alt  
              : $(container_holds_divs[0])?.text()?.trim()?.split("\n")
              ?.map(each=>each.trim()).join(" ") 
              ?? "" 

      /*
      Getting Extension(Year):
      Easily we can check DIV-2 content 
      */
      year = $(container_holds_divs[1])?.text()?.trim()
    }     
    const extensions = [year];


    /*
    For Every Anchor Element we might have "href" attribute 
    */

    const link = $eachAnchor.attr("href")!==undefined 
                ? domain + $eachAnchor.attr("href") 
                : ""
    
    /*
    
    Getting image URL:
    We might have Image Element inside every Anchor Element using "data-src" in it we can find image urls,
    or we can also find it from the "script" elements which are mapped with "id" values and such type of images are reffered as lazy images or deferredd images.    

    */   
    const image = $eachAnchor.find("img")?.attr("data-src") 
    ?? ($eachAnchor.find("img")?.attr("id") !==undefined 
    ?  deferredImageMap[$eachAnchor.find("img").attr("id")??""]: $eachAnchor.find("img").attr("src") ?? "")
  
    /*
    Here we are actually including the entities which has real value than 
    empty string or undefined values.
    */
    let resultObj:Partial<Painting>={};

    if( name && name.length>0) resultObj.name=name
    if( extensions[0].length>0) resultObj.extensions=extensions
    if( link && link.length>0) resultObj.link=link
    if( image && image.length>0) resultObj.image=image

    results.push(resultObj)
  })

  return results;
}


export function scrapePaintingAndSaveToFile(inputPath: string, outputPath: string): void {
  
  // ---> starting point.
  const finalJson=extractPaintings(inputPath)

  const finalOutput = {
    artworks:finalJson
  }
  fs.writeFile(outputPath, JSON.stringify(finalOutput, null, 2), 'utf-8',(err):undefined =>{
    if(err){
      console.log("Error writing to file:", err);
      return;
    }
    console.log(`Data successfully written to ${outputPath}`);
  });

}

scrapePaintingAndSaveToFile('/home/sharifdev/projects/my/scraping/scraping-1/fixtures/van-gogh-paintings.html', '/home/sharifdev/projects/my/scraping/scraping-1/json_outputs/van-gogh-paintings-extracted.json')