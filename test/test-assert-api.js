'use strict'
const inspect = obj => require('util').inspect(obj, {colors: true, depth: null})

const assert_tap_results = (t, tap1, expected_results, debug) => {
  for(let i=0; i<expected_results.length; i++) {
    let actual = tap1.results[i], expected = expected_results[i]
    delete actual.extra
    t.deepEqual(actual, expected)
  }
  t.equal(tap1.results.length, expected_results.length)
}

const assert_tap_output = (t, tap1, expected_output, debug) => {
  let tap_output = tap1.output.slice().sort()
  expected_output = expected_output.slice().sort()
  for(let i=0; i<expected_output.length; i++) {
    let actual = tap_output[i], expected = expected_output[i]
    if (!actual.startsWith(expected) && debug)
      console.log({actual, expected})
    t.ok(actual.startsWith(expected))
  }
  t.equal(tap1.output.length, expected_output.length)
}

const assert_tap_answers = (t, tap_promise, opt) =>
  tap_promise.then(tap => {
    try {
      if (opt.expected_summary)
        t.deepEqual(tap.summary, opt.expected_summary)

      if (opt.expected_results)
        assert_tap_results(t, tap, opt.expected_results, opt.debug)

      if (opt.expected_output)
        assert_tap_output(t, tap, opt.expected_output, opt.debug)

      if (tap.exitCode !== undefined)
        t.equal(tap.exitCode, opt.exitCode || 0)
      else t.equal(process.exitCode, opt.exitCode || 0)

    } catch(err) {
      if (opt.debug) console.log(inspect(tap))
      throw err
    }
  })

let tap0 = require('../tap-lite-tester')
tap0.start(5)

const createTestTAP = () =>
  Object.assign(tap0.createTAP(true), {
    setExitCode() { this.exitCode = this.summary.success ? 0 : 1 },
    log(out) {} })

tap0.test('garden path should succeed', t => {
  const tap1 = createTestTAP()

  tap1.start()
  tap1.test('works-one', t => {})
  tap1.test('works-two', t => Promise.resolve())
  tap1.test('works-three', t => {})

  return assert_tap_answers(t, tap1.finish(), {
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

  return assert_tap_answers(t, tap1.finish(), {
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

  return assert_tap_answers(t, tap1.finish(), {
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
      'not ok 4 - fails-four\n  ---\n  name: "AssertionError"\n  actual: 1\n  expected: 2\n  operator: "=="\n  message: "Should fail based on assetion exception"',
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

  return assert_tap_answers(t, tap1.finish(), {
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

  return assert_tap_answers(t, tap1.finish(), {
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


assert_tap_answers(require('assert'), tap0.finish(), {
  exitCode: 0,
  expected_results: [
    { success: true, total_pass: 5, total_fail: 0, planned: 5 },
    { success: true, test: { title: 'garden path should succeed', idx: 1, assertions: 11 } },
    { success: true, test: { title: 'garden path with plan should succeed', idx: 2, assertions: 12 } },
    { success: true, test: { title: 'failed test should fail', idx: 3, assertions: 17 } },
    { success: true, test: { title: 'plan under actual should fail', idx: 4, assertions: 10 } },
    { success: true, test: { title: 'plan over actual should fail', idx: 5, assertions: 8 } }
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

