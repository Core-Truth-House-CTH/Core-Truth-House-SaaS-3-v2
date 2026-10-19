import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getReleaseMetadataUrl,
  normalizeReleaseVersion,
  shouldOfferAppUpdate,
} from './appVersion.mjs'

const CURRENT_VERSION = '29638d68a264ef95d17c67806d4fde6b4b751935'
const CHANGED_VERSION = '39638d68a264ef95d17c67806d4fde6b4b751936'

test('matching frontend release metadata does not offer an update', () => {
  assert.equal(shouldOfferAppUpdate(CURRENT_VERSION, CURRENT_VERSION), false)
})

test('changed frontend release metadata offers an update', () => {
  assert.equal(shouldOfferAppUpdate(CURRENT_VERSION, CHANGED_VERSION), true)
})

test('missing and placeholder metadata are ignored', () => {
  for (const value of [undefined, null, '', '  ', 'dev', 'development', 'unknown']) {
    assert.equal(normalizeReleaseVersion(value), null)
    assert.equal(shouldOfferAppUpdate(CURRENT_VERSION, value), false)
  }
})

test('release metadata URL is same-origin and cache-busted', () => {
  assert.equal(getReleaseMetadataUrl(12345), '/version.json?_=12345')
})
