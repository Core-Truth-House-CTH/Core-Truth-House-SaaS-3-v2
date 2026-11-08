import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function textFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() ? textFiles(name)
      : /\.(jsx?|mjs|tsx?|css|md)$/.test(entry.name) ? [name] : [];
  });
}
test('display font declarations use Cormorant, including former font-only conflicts', () => {
  for (const filename of [
    ...textFiles(path.join(root, 'src')),
    path.join(root, 'index.html'),
    path.join(root, 'tailwind.config.js'),
    path.join(root, 'public/estate-assets/fonts/fonts.css'),
  ]) {
    assert.doesNotMatch(fs.readFileSync(filename, 'utf8'), /Playfair(?: |\+|%20)Display/,
      path.relative(root, filename));
  }
  assert.match(fs.readFileSync(path.join(root, 'tailwind.config.js'), 'utf8'),
    /display:\s*\['"Cormorant Garamond"'/);
});
test('Cormorant has a real local variable-font asset and license', () => {
  const directory = path.join(root, 'public/estate-assets/fonts');
  const font = fs.readFileSync(path.join(directory, 'CormorantGaramond-Variable.woff2'));
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  assert.ok(font.length > 10000);
  assert.ok(fs.readFileSync(path.join(directory, 'CormorantGaramond-OFL.txt'), 'utf8').includes('SIL OPEN FONT LICENSE'));
  assert.match(fs.readFileSync(path.join(directory, 'fonts.css'), 'utf8'),
    /font-family:'Cormorant Garamond';font-style:normal;font-weight:300 700/);
});
