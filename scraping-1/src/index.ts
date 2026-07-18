import { scrapePaintingAndSaveToFile } from "./scraper.js";
import path from 'path'

const root = process.cwd()

const fixtureFolder = path.join(root, "fixtures")
const jsonOutputsFolder = path.join(root,"json_outputs")

scrapePaintingAndSaveToFile(`${fixtureFolder}/van-gogh-paintings.html`, `${jsonOutputsFolder}/van-gogh-paintings-extracted.json`)
scrapePaintingAndSaveToFile(`${fixtureFolder}/pablo_picasso_paintings.html`, `${jsonOutputsFolder}/pablo_picasso_paintings-extracted.json`)
scrapePaintingAndSaveToFile(`${fixtureFolder}/monet_paintings_fr.html`, `${jsonOutputsFolder}/monet_paintings_fr-extracted.json`)
scrapePaintingAndSaveToFile(`${fixtureFolder}/power_cast.html`, `${jsonOutputsFolder}/power_cast-extracted.json`)