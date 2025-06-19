import { assertEquals, assertThrows } from "@std/assert";
import {
  analyzeFontFaceUnicodeRanges,
  countUnicodeRangeCodePoints,
} from "./fontface.ts";

Deno.test("analyzeFontFaceUnicodeRanges - basic @font-face rules with unicode-range", () => {
  const css = `
    @font-face {
      font-family: 'TestFont';
      src: url('font1.woff2');
      unicode-range: U+0000-00FF;
    }

    @font-face {
      font-family: 'TestFont';
      src: url('font2.woff2');
      unicode-range: U+0100-01FF;
    }
  `;

  const result = analyzeFontFaceUnicodeRanges(css);

  assertEquals(result, {
    "TestFont": [256, 256],
  });
});

Deno.test("analyzeFontFaceUnicodeRanges - multiple font families", () => {
  const css = `
    @font-face {
      font-family: 'FontA';
      src: url('font1.woff2');
      unicode-range: U+0000-00FF;
    }

    @font-face {
      font-family: 'FontB';
      src: url('font2.woff2');
      unicode-range: U+0100-01FF;
    }
  `;

  const result = analyzeFontFaceUnicodeRanges(css);

  assertEquals(result, {
    "FontA": [256],
    "FontB": [256],
  });
});

Deno.test("analyzeFontFaceUnicodeRanges - @font-face without unicode-range", () => {
  const css = `
    @font-face {
      font-family: 'NoRangeFont';
      src: url('font.woff2');
    }
  `;

  const result = analyzeFontFaceUnicodeRanges(css);

  assertEquals(result, {
    "NoRangeFont": [0],
  });
});

Deno.test("analyzeFontFaceUnicodeRanges - quoted font-family names", () => {
  const css = `
    @font-face {
      font-family: "Quoted Font";
      src: url('font1.woff2');
      unicode-range: U+0000-00FF;
    }

    @font-face {
      font-family: 'Single Quoted';
      src: url('font2.woff2');
      unicode-range: U+0100-01FF;
    }
  `;

  const result = analyzeFontFaceUnicodeRanges(css);

  assertEquals(result, {
    "Quoted Font": [256],
    "Single Quoted": [256],
  });
});

Deno.test(
  "analyzeFontFaceUnicodeRanges - complex unicode-range values",
  () => {
    const css = `
    @font-face {
      font-family: 'ComplexFont';
      src: url('font1.woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153;
    }
  `;

    const result = analyzeFontFaceUnicodeRanges(css);

    assertEquals(result, {
      "ComplexFont": [259],
    });
  },
);

Deno.test(
  "analyzeFontFaceUnicodeRanges - wildcard unicode-range values",
  () => {
    const css = `
    @font-face {
      font-family: 'WildcardFont';
      src: url('font1.woff2');
      unicode-range: U+4??, U+5???;
    }
  `;

    const result = analyzeFontFaceUnicodeRanges(css);

    assertEquals(result, {
      "WildcardFont": [4352],
    });
  },
);

Deno.test("analyzeFontFaceUnicodeRanges - empty CSS", () => {
  const css = "";
  const result = analyzeFontFaceUnicodeRanges(css);

  assertEquals(result, {});
});

Deno.test("analyzeFontFaceUnicodeRanges - CSS without @font-face rules", () => {
  const css = `
    body {
      font-family: Arial, sans-serif;
    }

    .title {
      font-size: 24px;
    }
  `;

  const result = analyzeFontFaceUnicodeRanges(css);

  assertEquals(result, {});
});

Deno.test("analyzeFontFaceUnicodeRanges - @font-face without font-family", () => {
  const css = `
    @font-face {
      src: url('font.woff2');
      unicode-range: U+0000-00FF;
    }
  `;

  const result = analyzeFontFaceUnicodeRanges(css);

  assertEquals(result, {});
});

Deno.test("analyzeFontFaceUnicodeRanges - accumulate multiple @font-face rules for same font-family", () => {
  const css = `
    @font-face {
      font-family: 'AccumulatedFont';
      src: url('font1.woff2');
      unicode-range: U+0000-00FF;
    }

    @font-face {
      font-family: 'AccumulatedFont';
      src: url('font2.woff2');
      unicode-range: U+0100-01FF;
    }

    @font-face {
      font-family: 'AccumulatedFont';
      src: url('font3.woff2');
      unicode-range: U+0200-02FF;
    }
  `;

  const result = analyzeFontFaceUnicodeRanges(css);

  assertEquals(result, {
    "AccumulatedFont": [256, 256, 256],
  });
});

Deno.test("countUnicodeRangeCodePoints - single code point", () => {
  assertEquals(countUnicodeRangeCodePoints("U+4E00"), 1);
});

Deno.test("countUnicodeRangeCodePoints - range of code points", () => {
  assertEquals(countUnicodeRangeCodePoints("U+0000-00FF"), 256);
  assertEquals(countUnicodeRangeCodePoints("U+015E-015F"), 2);
});

Deno.test("countUnicodeRangeCodePoints - wildcard code points", () => {
  assertEquals(countUnicodeRangeCodePoints("U+4??"), 256);
  assertEquals(countUnicodeRangeCodePoints("U+??"), 256);
  assertEquals(countUnicodeRangeCodePoints("U+5???"), 4096);
});

Deno.test("countUnicodeRangeCodePoints - case-insensitive unicode range", () => {
  assertEquals(countUnicodeRangeCodePoints("u+0000-00ff"), 256);
  assertEquals(countUnicodeRangeCodePoints("U+0000-00FF"), 256);
});

Deno.test("countUnicodeRangeCodePoints - invalid range", () => {
  assertThrows(() => {
    countUnicodeRangeCodePoints("U+0200-0100");
  });
});
