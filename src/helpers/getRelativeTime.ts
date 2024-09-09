const rtf = new Intl.RelativeTimeFormat("en", {
  localeMatcher: "best fit", // other values: "lookup"
  numeric: "always", // other values: "auto"
  style: "long", // other values: "short" or "narrow"
});

export default function getRelativeTime(time: number) {
  rtf.format((time - Date.now()) / 1000, "second");
}
