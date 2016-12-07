'use strict'
const tap = require('tap-lite-tester')
const tgt = require('../index')

const delay = (ms, ans) =>
  new Promise(resolve => setTimeout(resolve, ms, ans))

const uniq_sym = Symbol('keen')

tap.start()
tap.test('ident', t =>
  tgt.ident(uniq_sym).then(ans => t.strictEqual(ans, uniq_sym)))

tap.test('add', t =>
  tgt.add(7,5).then(ans => t.equal(ans, 12)))

tap.test('mul', t =>
  t.equal(1+1, 4-2))

tap.todo('div', t =>
  tgt.div(42,6).then(ans => t.equal(ans, 7)))

tap.test('mod')

tap.test.skip('mul', t =>
  tgt.mul(x,y).then(ans => t.fail("how'd you get here anyway?")))

tap.finish(6)
