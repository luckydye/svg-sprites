import fs from "fs";
import fastGlob from "fast-glob";
import SVGSpriter from "svg-sprite";
import type { PluginOption } from "vite";

interface SVGSpriteOptions {
  dir: string;
  svg?: SVGSpriter.Config;
}

async function buildSprite(sourceDir: string, options: SVGSpriteOptions): Promise<string[]> {
  const entries = await fastGlob([sourceDir]);
  const spriter = new SVGSpriter({
    mode: {
      defs: true, // Create a «defs» sprite
    },
    ...options.svg,
  });

  for (let entry of entries) {
    spriter.add(entry, null, fs.readFileSync(entry, { encoding: "utf-8" }));
  }

  const { result } = await spriter.compileAsync();

  return result.defs.sprite.contents.toString("utf8");
}

export default function svgSprite(
  options: SVGSpriteOptions = { dir: "assets/icons/*.svg" }
): PluginOption {
  const virtualId = "vite-svg-sprite:sheet";

  const svg = buildSprite(options.dir, options);

  return {
    name: "svg-sprite",
    enforce: "pre",

    // resolveId(id) {
    //   if (id === "@atrium-ui/vite-svg-sprite/Icon") {
    //     console.log("XXXXXXXXXXXXXXXXXXXXXXXXX");

    //     // return virtualId;
    //   }
    // },

    // load() {},

    async transform(code: string, id: string) {
      console.log(id);

      if (id.match("dist/Icon.mjs")) {
        return `
          ${code}
          ${`const sheetURL = URL.createObjectURL(new Blob(['${await svg}'], { type: "image/svg+xml" }));`}
        `;
      }
    },

    // async load(id) {
    //   if (id === virtualId) {
    //     console.log(await this.load({ id: "./Icon.ts" }));
    //     // const c = this.resolve("src/Icon.ts");
    //     // console.log(c);

    //     return `
    //       ${`const sheetURL = URL.createObjectURL(new Blob(['${await svg}'], { type: "image/svg+xml" }));`}
    //     `;
    //   }
    // },
  };
}
