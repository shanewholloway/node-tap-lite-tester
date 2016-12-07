'use strict'
const {assert_tap_answers, check_tap_answers, createTestTAP, inspect} = require('./_assert_utils')


let tap0 = require('../tap-lite-tester')
tap0.inspect = inspect
tap0.start()

tap0.test('garden path should succeed', t => {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.test('works-one', t => {})
  tap1.only('works-two', t => Promise.resolve())
  tap1.test('works-three', t => {})

  return check_tap_answers(t, tap1.finish(), {
    expected_results: [
      { success: true, total_pass: 3, total_fail: 0 },
      undefined,
      { success: true, test: { title: 'works-two', idx: 2 } },
      undefined,
    ],
    expected_output: [
      'TAP version 13',
      'ok 2 - works-two',
    ]})
})

tap0.test('garden path with plan should succeed', t => {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.plan(3)
  tap1.test('works-one', t => {})
  tap1.test('works-two', t => Promise.resolve())
  tap1.only('works-three', t => {})

  return check_tap_answers(t, tap1.finish(), {
    debug: true,
    expected_results: [
      { success: true, total_pass: 3, total_fail: 0, planned: 3 },
      null,
      null,
      { success: true, test: { title: 'works-three', idx: 3 } },
    ],
    expected_output: [
      'TAP version 13',
      '1..3',
      'ok 3 - works-three',
    ]})
})

tap0.test('failed test should fail', t => {
  const tap1 = createTestTAP()

  tap1.start(6)
  tap1.test('works-one', t => { t.plan(1); t.ok(true) })
  tap1.test('fails-two', t => { throw new Error('Should fail based on exception!') })
  tap1.test('fails-three', t => Promise.reject('Should fail based on promise rejection'))
  tap1.test('fails-four', t => { t.equal(1, 2, 'Should fail based on assetion exception') })
  tap1.test('works-two', t => Promise.resolve().then(()=>true))
  tap1.only('fails-six', t => { t.plan(4); t.ok(true) /* Should fail based on plan != actual*/ })

  return check_tap_answers(t, tap1.finish(), {
    exitCode: 1,
    expected_results: [
      { success: false, total_pass: 5, total_fail: 1, planned: 6 },
      null,
      null,
      null,
      null,
      null,
      { success: false, test: { title: 'fails-six', idx: 6, assertions: 1, planned: 4 } },
    ],
    expected_output: [
      'TAP version 13',
      '1..6',
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
  tap1.test.only('works-three', t => {})
  tap1.test('works-four', t => {})

  return check_tap_answers(t, tap1.finish(), {
    exitCode: 1,
    expected_summary:
      { success: false, total_pass: 4, total_fail: 1, planned: 3 },
    expected_output: [
      'TAP version 13',
      '1..3',
      'not ok - TAP planned for 3, but registered 4 tests',
      'ok 3 - works-three',
    ]})
})

tap0.test('plan over actual should fail', t => {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.plan(3)
  tap1.test('works-two', t => Promise.resolve())
  tap1.only('works-three', t => {})

  return check_tap_answers(t, tap1.finish(), {
    exitCode: 1,
    expected_summary:
      { success: false, total_pass: 2, total_fail: 1, planned: 3 },
    expected_output: [
      'TAP version 13',
      '1..3',
      'not ok - TAP planned for 3, but registered 2 tests',
      'ok 2 - works-three',
    ]})
})


assert_tap_answers(tap0.finish(5), {
  exitCode: 0,
  expected_results: [
    { success: true, total_pass: 5, total_fail: 0, planned: 5 },
    { success: true, test: { title: 'garden path should succeed', idx: 1, assertions: 9 } },
    { success: true, test: { title: 'garden path with plan should succeed', idx: 2, assertions: 10 } },
    { success: true, test: { title: 'failed test should fail', idx: 3, assertions: 13 } },
    { success: true, test: { title: 'plan under actual should fail', idx: 4, assertions: 7 } },
    { success: true, test: { title: 'plan over actual should fail', idx: 5, assertions: 7 } }
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

