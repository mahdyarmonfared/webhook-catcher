/**
 * Zero-dependency ANSI color utilities for WebhookCatcher.
 */

const isTTY = process.stdout.isTTY;

const codes = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39]
};

const chalk = {};

Object.keys(codes).forEach((key) => {
  const [open, close] = codes[key];
  chalk[key] = (str) => {
    if (!isTTY && !process.env.FORCE_COLOR) return String(str);
    return `\x1b[${open}m${str}\x1b[${close}m`;
  };
});

module.exports = {
  chalk
};
