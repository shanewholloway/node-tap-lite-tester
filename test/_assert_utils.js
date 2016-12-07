'use strict'
const assert = require('assert')
const inspect = obj => require('util').inspect(obj, {colors: true, depth: null})

const tap = require('../tap-lite-tester')

const createTestTAP = () =>
  Object.assign(tap.createTAP(true), {
    setExitCode() { this.exitCode = this.summary.success ? 0 : 1 },
    inspect, log(out) {} })

const assert_tap_answers = (tap_promise, opt) =>
  check_tap_answers(assert, tap_promise, opt)

const check_tap_answers = (t, tap_promise, opt) =>
  tap_promise.then(tap => {
    try {
      if (opt.expected_output)
        check_tap_output(t, tap, opt.expected_output, opt.debug)

      if (opt.expected_results)
        check_tap_results(t, tap, opt.expected_results, opt.debug)

      if (tap.exitCode !== undefined)
        t.equal(tap.exitCode, opt.exitCode || 0)
      else t.equal(process.exitCode, opt.exitCode || 0, 'exit code mismatch')

      if (opt.expected_summary)
        t.deepEqual(tap.summary, opt.expected_summary, 'summary mismatch')

    } catch(err) {
      if (opt.debug) console.log(inspect(tap))
      throw err
    }
  })


const check_tap_results = (t, tap1, expected_results, debug) => {
  for(let i=0; i<expected_results.length; i++) {
    let actual = tap1.results[i], expected = expected_results[i]
    if (actual == null)
      t.equal(actual, expected, `result mismatch at idx ${i} with null`)
    else {
      delete actual.extra
      t.deepEqual(actual, expected, `result mismatch at idx ${i}`)
    }
  }
  t.equal(tap1.results.length, expected_results.length, 'Result length mismatch')
}


const check_tap_output = (t, tap1, expected_output, debug) => {
  let tap_output = tap1.output.slice().sort()
  expected_output = expected_output.slice().sort()
  for(let i=0; i<expected_output.length; i++) {
    let actual = tap_output[i], expected = expected_output[i]
    if (!actual.startsWith(expected) && debug)
      console.log({actual, expected})
    t.ok(actual.startsWith(expected), {reason:'output mismatch', actual, expected})
  }
  t.equal(tap1.output.length, expected_output.length, 'output length mismatch')
}

Object.assign(exports, {
  createTestTAP, inspect,
  assert_tap_answers,
  check_tap_answers,
  check_tap_results,
  check_tap_output,
})
