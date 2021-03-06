'use strict'
const {assert_tap_answers, check_tap_answers, createTestTAP, isPreNodeV8} = require('./_assert_utils')

let tap0 = require('../tap-lite-tester')
tap0.start(6)

tap0.test('garden path should succeed', t => {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.test('works-one', t => {})
  tap1.test('works-two', t => Promise.resolve())
  tap1.test('works-three', t => {})

  return check_tap_answers(t, tap1.finish(), {
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

tap0.test('garden path with plan should succeed', t => {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.plan(3)
  tap1.test('works-one', t => {})
  tap1.test('works-two', t => Promise.resolve())
  tap1.test('works-three', t => {})

  return check_tap_answers(t, tap1.finish(), {
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

tap0.test('failed test should fail', t => {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.test('works-one', t => { t.plan(1); t.ok(true) })
  tap1.test('fails-two', t => { throw new Error('Should fail based on exception!') })
  tap1.test('fails-three', t => Promise.reject('Should fail based on promise rejection'))
  tap1.test('fails-four', t => { t.equal(1, 2, 'Should fail based on assetion exception') })
  tap1.test('works-two', t => Promise.resolve().then(()=>true))
  tap1.test('fails-six', t => { t.plan(4); t.ok(true) /* Should fail based on plan != actual*/ })

  return check_tap_answers(t, tap1.finish(), {
    exitCode: 1,
    expected_results: [
      { success: false, total_pass: 2, total_fail: 4 },
      { success: true, test: { title: 'works-one', idx: 1, assertions: 1, planned: 1 } },
      { success: false, test: { title: 'fails-two', idx: 2 } },
      { success: false, test: { title: 'fails-three', idx: 3 } },
      { success: false, test: { title: 'fails-four', idx: 4, assertions: 1, failed: 1 } },
      { success: true, test: { title: 'works-two', idx: 5 } },
      { success: false, test: { title: 'fails-six', idx: 6, assertions: 1, planned: 4 } },
    ],
    expected_output: [
      'TAP version 13',
      'ok 1 - works-one',
      'not ok 2 - fails-two\n  ---\n  Error: Should fail based on exception!\n',
      isPreNodeV8
        ? 'not ok 4 - fails-four\n  ---\n  name: "AssertionError"\n  actual: 1\n  expected: 2\n  operator: "=="\n  message: "Should fail based on assetion exception"'
        : 'not ok 4 - fails-four\n  ---\n  generatedMessage: false\n  name: "AssertionError [ERR_ASSERTION]"\n  code: "ERR_ASSERTION"\n  actual: 1\n  expected: 2\n  operator: "=="',
      'not ok 3 - fails-three\n  ---\n  Should fail based on promise rejection',
      'ok 5 - works-two',
      'not ok 6 - fails-six\n  ---\n  Error: Test performed 1 assertions, but planned 4 assertions\n',
    ],
  })
})


tap0.test('plan under actual should fail', t => {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.plan(3)
  tap1.test('works-one', t => {})
  tap1.test('works-two', t => Promise.resolve())
  tap1.test('works-three', t => {})
  tap1.test('works-four', t => {})

  return check_tap_answers(t, tap1.finish(), {
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

tap0.test('plan over actual should fail', t => {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.plan(3)
  tap1.test('works-two', t => Promise.resolve())
  tap1.test('works-three', t => {})

  return check_tap_answers(t, tap1.finish(), {
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


tap0.test('promise and async assertions should work', t => {
  const tap1 = createTestTAP()

  tap1.start(6)
  tap1.test('promiseResolves passes upon resolve', t =>
    t.promiseResolves(Promise.resolve(true)) )
  tap1.test('promiseResolves fails upon reject', t =>
    t.promiseResolves(Promise.reject(true)) )
  tap1.test('promiseRejects fails upon resolve', t =>
    t.promiseRejects(Promise.resolve(true)) )
  tap1.test('promiseRejects passes upon reject', t =>
    t.promiseRejects(Promise.reject(true)) )
  tap1.test('asyncThrow passes upon throw', t =>
    t.asyncThrows(async arg => { await arg; throw new Error('Error during async') }) )
  tap1.test('asyncThrow fails upon return', t =>
    t.asyncThrows(async arg => { await arg; return true }) )

  return check_tap_answers(t, tap1.finish(), {
    exitCode: 1,
    expected_summary:
      { success: false, total_pass: 3, total_fail: 3, planned: 6 },
    expected_output: [
      'TAP version 13',
      '1..6',
      'ok 1 - promiseResolves passes upon resolve',
      'not ok 2 - promiseResolves fails upon reject',
      'not ok 3 - promiseRejects fails upon resolve',
      'ok 4 - promiseRejects passes upon reject',
      'ok 5 - asyncThrow passes upon throw',
      'not ok 6 - asyncThrow fails upon return',
    ]})
})


assert_tap_answers(tap0.finish(), {
  exitCode: 0,
  expected_results: [
    { success: true, total_pass: 6, total_fail: 0, planned: 6 },
    { success: true, test: { title: 'garden path should succeed', idx: 1, assertions: 10 } },
    { success: true, test: { title: 'garden path with plan should succeed', idx: 2, assertions: 11 } },
    { success: true, test: { title: 'failed test should fail', idx: 3, assertions: 16 } },
    { success: true, test: { title: 'plan under actual should fail', idx: 4, assertions: 10 } },
    { success: true, test: { title: 'plan over actual should fail', idx: 5, assertions: 8 } },
    { success: true, test: { title: 'promise and async assertions should work', idx: 6, assertions: 11} },
  ],
  expected_output: [
    'TAP version 13',
    '1..6',
    'ok 1 - garden path should succeed',
    'ok 2 - garden path with plan should succeed',
    'ok 3 - failed test should fail',
    'ok 4 - plan under actual should fail',
    'ok 5 - plan over actual should fail',
    'ok 6 - promise and async assertions should work',
  ],
}).catch(err => {
  console.error(err)
  process.exitCode = 1
})

