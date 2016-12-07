'use strict'
const assert = require('assert')
const {assert_tap_answers, createTestTAP} = require('./_assert_utils')

let tap0 = require('../tap-lite-tester')
tap0.start(5)

tap0.test('garden path should succeed', ()=> {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.test('works-one', () => {})
  tap1.test('works-two', () => Promise.resolve())
  tap1.test('works-three', () => {})

  return assert_tap_answers(tap1.finish(), {
    expected_results: [
      { success: true, total_pass: 3, total_fail: 0 },
      { success: true, test: { title: 'works-one', idx: 1 } },
      { success: true, test: { title: 'works-two', idx: 2 } },
      { success: true, test: { title: 'works-three', idx: 3 } },
    ],
    expected_output: [
      'TAP version 13',
      'ok 1 - works-one',
      'ok 3 - works-three',
      'ok 2 - works-two',
    ]})
})

tap0.test('garden path with plan should succeed', ()=> {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.plan(3)
  tap1.test('works-one', () => {})
  tap1.test('works-two', () => Promise.resolve())
  tap1.test('works-three', () => {})

  return assert_tap_answers(tap1.finish(), {
    expected_results: [
      { success: true, total_pass: 3, total_fail: 0, planned: 3 },
      { success: true, test: { title: 'works-one', idx: 1 } },
      { success: true, test: { title: 'works-two', idx: 2 } },
      { success: true, test: { title: 'works-three', idx: 3 } },
    ],
    expected_output: [
      'TAP version 13',
      '1..3',
      'ok 1 - works-one',
      'ok 3 - works-three',
      'ok 2 - works-two',
    ]})
})

tap0.test('failed test should fail', ()=> {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.test('works-one', () => {})
  tap1.test('fails-two', () => { throw new Error('Should fail based on exception!') })
  tap1.test('fails-three', () => Promise.reject('Should fail based on promise rejection'))
  tap1.test('fails-four', () => { assert.equal(1, 2, 'Should fail based on assetion exception') })
  tap1.test('works-two', () => Promise.resolve().then(()=>true))

  return assert_tap_answers(tap1.finish(), {
    exitCode: 1,
    expected_results: [
      { success: false, total_pass: 2, total_fail: 3 },
      { success: true, test: { title: 'works-one', idx: 1 } },
      { success: false, test: { title: 'fails-two', idx: 2 } },
      { success: false, test: { title: 'fails-three', idx: 3 } },
      { success: false, test: { title: 'fails-four', idx: 4 } },
      { success: true, test: { title: 'works-two', idx: 5 } },
    ],
    expected_output: [
      'TAP version 13',
      'ok 1 - works-one',
      'not ok 2 - fails-two\n  ---\n  Error: Should fail based on exception!\n',
      'not ok 4 - fails-four\n  ---\n  name: "AssertionError"\n  actual: 1\n  expected: 2\n  operator: "=="\n  message: "Should fail based on assetion exception"',
      'not ok 3 - fails-three\n  ---\n  Should fail based on promise rejection',
      'ok 5 - works-two',
    ],
  })
})


tap0.test('plan under actual should fail', ()=> {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.plan(3)
  tap1.test('works-one', () => {})
  tap1.test('works-two', () => Promise.resolve())
  tap1.test('works-three', () => {})
  tap1.test('works-four', () => {})

  return assert_tap_answers(tap1.finish(), {
    exitCode: 1,
    expected_summary:
      { success: false, total_pass: 4, total_fail: 1, planned: 3 },
    expected_output: [
      'TAP version 13',
      '1..3',
      'not ok - TAP planned for 3, but registered 4 tests',
      'ok 1 - works-one',
      'ok 3 - works-three',
      'ok 4 - works-four',
      'ok 2 - works-two',
    ]})
})

tap0.test('plan over actual should fail', ()=> {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.plan(3)
  tap1.test('works-two', () => Promise.resolve())
  tap1.test('works-three', () => {})

  return assert_tap_answers(tap1.finish(), {
    exitCode: 1,
    expected_summary:
      { success: false, total_pass: 2, total_fail: 1, planned: 3 },
    expected_output: [
      'TAP version 13',
      '1..3',
      'not ok - TAP planned for 3, but registered 2 tests',
      'ok 2 - works-three',
      'ok 1 - works-two',
    ]})
})


assert_tap_answers(tap0.finish(), {
  exitCode: 0,
  expected_results: [
    { success: true, total_pass: 5, total_fail: 0, planned: 5 },
    { success: true, test: { title: 'garden path should succeed', idx: 1 } },
    { success: true, test: { title: 'garden path with plan should succeed', idx: 2 } },
    { success: true, test: { title: 'failed test should fail', idx: 3 } },
    { success: true, test: { title: 'plan under actual should fail', idx: 4 } },
    { success: true, test: { title: 'plan over actual should fail', idx: 5 } }
  ],
  expected_output: [
    'TAP version 13',
    '1..5',
    'ok 1 - garden path should succeed',
    'ok 2 - garden path with plan should succeed',
    'ok 3 - failed test should fail',
    'ok 4 - plan under actual should fail',
    'ok 5 - plan over actual should fail',
  ],
}).catch(err => {
  console.error(err)
  process.exitCode = 1
})

