import { analyzeFontFaceUnicodeRanges } from "./fontface.ts";

async function fetchGoogleFontCss(fontFamily: string) {
  const url = `https://fonts.googleapis.com/css2?${new URLSearchParams({
    family: fontFamily,
    display: "swap",
  })}`;
  const response = await fetch(
    url,
    {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:139.0) Gecko/20100101 Firefox/139.0",
      },
    },
  );
  return response.text();
}

async function analyzeGoogleFont(fontFamily: string) {
  const css = await fetchGoogleFontCss(fontFamily);

  const result = analyzeFontFaceUnicodeRanges(css);
  const codePointCountsPerChunk = Object.values(result)[0];
  return {
    codePointCountsPerChunk,
    totalCodePoints: codePointCountsPerChunk.reduce(
      (sum, count) => sum + count,
      0,
    ),
  };
}

console.log(
  (await analyzeGoogleFont("Noto Sans JP")).codePointCountsPerChunk.length,
);
