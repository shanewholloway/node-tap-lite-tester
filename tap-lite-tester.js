'use strict'
const assert = require('assert')

module.exports = exports = createTAP(true)
function createTAP(setExitCode_p) {
  let summary = {success: null, total_pass: 0, total_fail: 0}

  function test(title, cb) {
    if (!cb) return tap.todo(title)
    else return tap._test(title, cb) }

  let tap = {
    createTAP,
    summary,
    TAPTest,
    results: [summary],
    output: [],

    start(count) {
      tap._output("TAP version 13")
      if (count) tap.plan(count) },

    plan(count) { 
      summary.planned = count
      tap._output(`1..${count}`) },

    skip(title, cb) {
      let test = new tap.TAPTest({title, directive: 'SKIP', idx: ++tap._tap_idx})
      return tap._addTestPromise(test,
        tap._withTest(test)
          .then(() => tap._result(true, test)))
    },

    todo(title, cb) {
      let test = new tap.TAPTest({title, directive: 'TODO', idx: ++tap._tap_idx})
      return tap._addTestPromise(test,
        tap._withTest(test)
          .then(() => tap._result(false, test)))
    },

    only(title, cb) {
      throw new Error("only() is not yet implemented")
    },

    test, _test(title, cb) {
      let test = new tap.TAPTest({title, idx: ++tap._tap_idx})
      return tap._addTestPromise(test,
        tap._withTest(test, cb)
          .then(ans => (test.validate(), ans))
          .then(ans => tap._result(true, test, typeof ans==='object' ? ans : undefined),
                err => tap._result(false, test, err))) },

    finish(count, setExitCode=setExitCode_p) {
      if (count) tap.plan(count)
      tap._checkPlannedCount()
      let tests = tap._all_tests
      tap._all_tests = null
      return Promise.all(tests)
        .then(() => {
          summary.success = summary.total_fail === 0

          if (setExitCode)
            tap.setExitCode()
          return tap }) },

    setExitCode() {
      process.exitCode = (summary.success ? 0 : 1) },

    log(out) { console.log(out) },

    _output(out) { tap.output.push(out); tap.log(out) },
    _result(success, test, extra) {
      if (success) ++summary.total_pass
      else ++summary.total_fail

      let out = tap._report(success, test, extra, tap.inspect)
      if (test.idx)
        tap.results[test.idx] = extra===undefined ? {success, test} : {success, test, extra}
      tap._output(out)
    },
    _report: _tap_report,

    _withTest(test, cb) {
      return Promise.resolve(test)
        .then(test => cb ? cb(test) : null) },

    _addTestPromise(test, promise) {
      promise.test = test
      tap._all_tests.push(promise)
      return promise },

    _checkPlannedCount() {
      if (summary.planned == tap._tap_idx) return true
      if (summary.planned == null) return true
      tap._result(false, {title: `TAP planned for ${summary.planned}, but registered ${tap._tap_idx} tests`, idx: 'plan'})
      return false },
  }

  test.todo = tap.todo
  test.skip = tap.skip
  test.only = tap.only

  return Object.defineProperties(tap, 
    {_all_tests: {value: [], writable: true},
     _tap_idx: {value: 0, writable: true}})
}


function TAPTest(options) {
  Object.keys(options)
    .forEach(k => this[k] = options[k])
}

TAPTest.prototype.assertions = 0
TAPTest.prototype.failed = 0

TAPTest.prototype.plan = function(count) {
  this.planned = count
  return this }

TAPTest.prototype.validate = function() {
  if (this.planned != null && this.planned != this.assertions)
    throw new Error(`Test performed ${this.assertions} assertions, but planned ${this.planned} assertions`)
  if (this.failed > 0)
    throw new Error(`Test failed ${this.failed} of ${this.assertions} assertions performed`)
  return this }
Object.keys(assert).forEach(k => {
  const inner_fn = assert[k]

  TAPTest.prototype[k] = function() {
    this.assertions += 1
    try { return inner_fn.apply(null, arguments) }
    catch (err) { this.failed += 1; throw err }}
})



function _tap_asYamlExtra(key, value) {
  if (!Array.isArray(value))
    return `${key}: ${JSON.stringify(value)}`

  if (0 === value.length)
    return `${key}: []\n`

  let lines = value.map(ea => JSON.stringify(ea))
  let len = lines.reduce((r, e) => r+e.length, 0)

  if (len < 40)
    return `${key}: [${lines.join(', ')}]\n`

  lines.unshift('')
  return `${key}:${lines.join('\n - ')}\n`
}


function _tap_report(success, test, extra, debug_inspect) {
  if (test.omit) return

  let out = [
    success ? 'ok' : 'not ok',
    Number(test.idx),
    `- ${test.title}`]

  if (test.directive)
    out.push(`# ${test.directive}`)

  out = out.filter(v=>v).join(' ')

  if (null != extra) {
    let lines

    if ('string' === typeof extra)
      lines = extra.split(/\r?\n/)

    else if ('object' === typeof extra)
      lines = Object.keys(extra)
        .map(k => _tap_asYamlExtra(k, extra[k]) )
        .filter(e => e)

    if (lines.length) {
      lines = lines.join('\n').split('\n')
      lines.push('')
    } else if (extra.toString)
      lines = extra.toString().split(/\r?\n/)

    if (debug_inspect)
      lines = lines.concat(debug_inspect(extra).split(/\r?\n/).map(l => '# '+l))

    lines.unshift('')
    out += `\n  ---${lines.join('\n  ')}\n`
  }
  return out
}

