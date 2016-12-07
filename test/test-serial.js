'use strict'
const assert = require('assert')
const {assert_tap_answers, inspect} = require('./_assert_utils')
const tap = require('../tap-lite-tester')
tap.inspect = inspect

let pre_log=[], pre = (ans) => (pre_log.push(ans), ans)
let post_log=[], post = (ans) => (post_log.push(ans), ans)

let delay = (ms, ans) =>
  new Promise(resolve => setTimeout(resolve, ms, pre(ans))).then(post)

tap.test('non-serial first', t => delay(20, t.title))
tap.test('non-serial second', t => post(pre(t.title)))

tap.serial('serial first', t => delay(30, t.title))
tap.serial('serial second', t => post(pre(t.title)))
tap.serial('serial third', t => delay(10, t.title))
tap.serial('serial fourth', t => delay(0, t.title))

tap.test('non-serial last', t => post(pre(t.title)))

let done = tap.finish(7)
done.then(() => {
  const pre_log_expected = [
    'non-serial first',
    'non-serial second',
    'non-serial last',
    'serial first',
    'serial second',
    'serial third',
    'serial fourth',
  ]

  assert.deepEqual(pre_log, pre_log_expected, 'pre-log')
}).catch(console.error)

done.then(() => {
  const post_log_expected = [
    'non-serial second',
    'non-serial last',
    'non-serial first',
    'serial first',
    'serial second',
    'serial third',
    'serial fourth',
  ]
  assert.deepEqual(post_log, post_log_expected, 'post-log')
}).catch(console.error)

assert_tap_answers(done, {
  exitCode: 0,
  expected_results: [
    { success: true, total_pass: 7, total_fail: 0, planned: 7 },
    { success: true, test: { title: 'non-serial first', idx: 1 } },
    { success: true, test: { title: 'non-serial second', idx: 2 } },
    { success: true, test: { title: 'serial first', idx: 3 } },
    { success: true, test: { title: 'serial second', idx: 4 } },
    { success: true, test: { title: 'serial third', idx: 5 } },
    { success: true, test: { title: 'serial fourth', idx: 6 } },
    { success: true, test: { title: 'non-serial last', idx: 7 } }
  ],
  expected_output: [
    'TAP version 13',
    '1..7',
    'ok 2 - non-serial second',
    'ok 7 - non-serial last',
    'ok 1 - non-serial first',
    'ok 3 - serial first',
    'ok 4 - serial second',
    'ok 5 - serial third',
    'ok 6 - serial fourth',
  ],
}).catch(err => {
  console.error(err)
  process.exitCode = 1
})

