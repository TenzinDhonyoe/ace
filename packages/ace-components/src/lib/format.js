// Scientific-notation formatter ported from BME804's fmtSci helper.
// Returns "—" for non-finite, "0" for zero, decimal for 0.01..10000,
// and mantissa·10^exp for everything else.

const SUP_DIGITS = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

function sup(n) {
  return String(n).split("").map((c) => SUP_DIGITS[c] || c).join("");
}

export function fmtSci(x, d = 2) {
  if (!isFinite(x)) return "—";
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 0.01 && a < 10000) return x.toFixed(d);
  const e = Math.floor(Math.log10(a));
  const m = x / Math.pow(10, e);
  return m.toFixed(d) + "·10" + sup(e);
}

// SI-prefix formatter for readouts like "3.2 µN" — picks the right prefix.
// Used for the physics slider readouts.
export function fmtSI(x, unit, decimals = 2) {
  if (!isFinite(x)) return "—";
  const a = Math.abs(x);
  const prefixes = [
    [1e-12, "p"], [1e-9, "n"], [1e-6, "µ"], [1e-3, "m"],
    [1, ""], [1e3, "k"], [1e6, "M"], [1e9, "G"],
  ];
  let chosen = prefixes[4];
  for (let i = prefixes.length - 1; i >= 0; i--) {
    if (a >= prefixes[i][0]) { chosen = prefixes[i]; break; }
  }
  return (x / chosen[0]).toFixed(decimals) + " " + chosen[1] + unit;
}
