import { processGed } from "./src/ged-processor.js";
import { generateHtml } from "./src/template-processor.js";
import * as fs from "fs";
import commandLineArgs, { OptionDefinition } from "command-line-args";

const optionDefinitions: OptionDefinition[] = [
  { name: "file", alias: "f", type: String, defaultOption: true },
  { name: "name", alias: "n", type: String },
  { name: "family-inline", type: Boolean, defaultValue: false },
  { name: "family-section", type: Boolean, defaultValue: true },
];

const options = commandLineArgs(optionDefinitions);
const familyTree = await processGed(options.file);
const html = generateHtml(familyTree, {
  name: options.name,
  family_inline: options["family-inline"],
  family_section: options["family-section"],
});

fs.writeFileSync("./output.html", html);
