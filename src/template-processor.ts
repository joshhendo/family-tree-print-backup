import Handlebars from "handlebars";
import { FamilyTree } from "./ged-processor.js";
import fs from "fs";
import * as sass from "sass";
import dayjs from "dayjs";

const templateSource = fs
  .readFileSync("./templates/template.hbs")
  .toString("utf-8");

interface GenerationOptions {
  name: string;
  family_inline: boolean;
  family_section: boolean;
}

export function generateHtml(
  familyTree: FamilyTree,
  options: GenerationOptions,
) {
  const css = sass.compile("./templates/template.scss");
  const cssReset = fs.readFileSync(
    "./node_modules/reset-css/reset.css",
    "utf-8",
  );
  const template = Handlebars.compile(templateSource);

  return template({
    family_tree_name: `${options.name ?? ""} Family Tree`.trimStart(),
    generated_date: dayjs().format("DD MMMM YYYY"),
    ...css,
    css_reset: cssReset,
    ...familyTree,
    options: {
      family_inline: options.family_inline,
      family_section: options.family_section,
    },
  });
}
