// @ts-types="@types/css-tree"
import * as cssTree from "css-tree";

/**
 * Code point counts for each `@font-face` grouped by `font-family`
 */
export interface FontFamilyStats {
  [fontFamily: string]: number[];
}

/**
 * Parse unicode range string (e.g., "U+0000-00FF", "U+4E00") and
 * count the number of code points covered
 */
export function countUnicodeRangeCodePoints(
  unicodeRange: string,
): number {
  const cleanRange = unicodeRange.replace(/^u\+/i, "");

  if (/^u\+[0-9a-f]+\-[0-9a-f]+$/i.test(unicodeRange)) {
    // Range specification (e.g., "0000-00FF")
    const [start, end] = cleanRange.split("-");
    const startCode = parseInt(start, 16);
    const endCode = parseInt(end, 16);

    if (startCode <= endCode) {
      return endCode - startCode + 1;
    } else {
      throw new Error(`Invalid unicode-range: ${unicodeRange}`);
    }
  } else if (/^u\+[0-9a-f]*\?+$/i.test(unicodeRange)) {
    // Wildcard specification (e.g., "4??", "4E??")
    const wildcardMatches = cleanRange.match(/\?/g);
    const wildcardCount = wildcardMatches ? wildcardMatches.length : 0;
    return Math.pow(16, wildcardCount);
  } else if (/^u\+[0-9a-f]+$/i.test(unicodeRange)) {
    // Single code point (e.g., "4E00")
    return 1;
  } else {
    throw new Error(`Invalid unicode-range: ${unicodeRange}`);
  }
}

function extractFontFaceInfo(node: cssTree.Atrule): {
  fontFamily: string | null;
  unicodeRanges: string[];
} {
  let fontFamily: string | null = null;
  const unicodeRanges: string[] = [];
  cssTree.walk(node, (node) => {
    if (node.type === "Declaration" && node.property === "font-family") {
      const fontFamilyValue = node.value;
      if (
        fontFamilyValue.type !== "Value" ||
        fontFamilyValue.children.size !== 1 ||
        fontFamilyValue.children.first?.type !== "String"
      ) {
        throw new Error("Unexpected value for `font-family`");
      }
      fontFamily = fontFamilyValue.children.first.value;
    }
    if (node.type === "Declaration" && node.property === "unicode-range") {
      const unicodeRangeValues = node.value;
      if (unicodeRangeValues.type !== "Value") {
        throw new Error(
          `Unexpected value for \`unicode-range\`: "${
            JSON.stringify(unicodeRangeValues.value)
          }"`,
        );
      }
      unicodeRangeValues.children.forEach((node) => {
        if (node.type === "UnicodeRange") {
          unicodeRanges.push(node.value);
        }
      });
    }
  });
  return {
    fontFamily,
    unicodeRanges,
  };
}

/**
 * Parse CSS and analyze `unicode-range` of `@font-face` rules
 * @param cssContent - CSS string
 * @returns array of code point counts for each font-family
 */
export function analyzeFontFaceUnicodeRanges(
  cssContent: string,
): FontFamilyStats {
  const ast = cssTree.parse(cssContent);
  const fontFamilyStats: FontFamilyStats = Object.create(null);

  if (ast.type !== "StyleSheet") {
    throw new Error("unexpected parse result");
  }

  cssTree.walk(ast, (node) => {
    if (node.type === "Atrule" && node.name === "font-face") {
      const fontFaceInfo = extractFontFaceInfo(node);

      if (fontFaceInfo.fontFamily !== null) {
        const codePointCount = fontFaceInfo.unicodeRanges.map((range) =>
          countUnicodeRangeCodePoints(range)
        ).reduce((sum, count) => sum + count, 0);

        if (!fontFamilyStats[fontFaceInfo.fontFamily]) {
          fontFamilyStats[fontFaceInfo.fontFamily] = [];
        }

        fontFamilyStats[fontFaceInfo.fontFamily].push(codePointCount);
      }
      return cssTree.walk.skip;
    }
  });

  return fontFamilyStats;
}
