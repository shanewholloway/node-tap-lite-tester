'use strict'
const assert = require('assert')

module.exports = exports = createTAP(true)
function createTAP(setExitCode_p) {
  let summary = {success: null, total_pass: 0, total_fail: 0}

  function test(title, cb) {
    if (!cb) return tap.todo(title)
    else return tap._test(title, cb) }

  let tap_start
  let tap_go = new Promise(resolve => tap_start = resolve)
    .then(() => {
      tap.output = []
      tap._output('TAP version 13')
      if (summary.planned) {
        tap._output(`1..${summary.planned}`)
        tap._checkPlannedCount()
      }
      return tap })

  let tap = {
    createTAP,
    summary,
    TAPTest,
    results: [summary],

    start(count) {
      if (count) tap.plan(count)
      return tap_go },

    plan(count) { 
      if (tap.output)
        throw new Error("Cannot change plan after running has commenced")
      summary.planned = count
      return tap_go },
    addPlans(inc_count) { 
      return tap.plan((inc_count || 1) + (summary.planned || 0)) },

    skip(title, cb, reason) { return tap._skip(title, cb, 'SKIP', reason) },
    todo(title, cb, reason) { return tap._skip(title, cb, 'TODO', reason) },
    failing(title, cb, reason) { return tap._skip(title, cb, 'TODO', 'failing') },

    serial(title, cb) {
      let prev = Promise.all(this._all_tests)
      return this._test(title, test => prev.then(() => cb(test))) },

    only(title, cb) {
      if (tap._only_test)
        throw new Error("Multiple 'only()' tests specified")
      let res = tap._test(title, cb)
      tap._only_test = tap._all_tests.pop()
      return res },

    test_cb(title, cb) {
      return tap._test(title, test =>
          new Promise((resolve, reject) => {
            test.end = test.done = (err, ans) => err ? reject(err) : resolve(ans)
            try { cb(test) } catch (err) { reject(err) } }) )},

    test, _test(title, cb) {
      let test = new tap.TAPTest({title, idx: ++tap._tap_idx})
      return tap._addTestPromise(test,
        tap._withTest(test, cb)
          .then(ans => (test.validate(), ans))
          .then(ans => tap._result(true, test, typeof ans==='object' ? ans : undefined),
                err => tap._result(false, test, err))) },

    _skip(title, _cb_, directive, reason) {
      let test = new tap.TAPTest({title, directive: [directive || 'SKIP', reason].join(' '), idx: ++tap._tap_idx})
      return tap._addTestPromise(test, tap._withTest(test).then(() => tap._result(true, test))) },


    finish(count, setExitCode=setExitCode_p) {
      if (count) tap.plan(count)
      let tests = tap._all_tests
      tap._all_tests = null
      if (tap._only_test) {
        tests.forEach(ea => ea.test.omit = true)
        tests = [tap._only_test]
      }

      tap_start(tap)
      return Promise.all(tests)
        .then(() => {
          summary.success = (summary.total_fail === 0)

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

      if (test.omit)
        return tap.results[test.idx] = null

      let out = tap._report(success, test, extra, tap.inspect)
      if (test.idx)
        tap.results[test.idx] = extra===undefined ? {success, test} : {success, test, extra}
      tap._output(out)
    },
    _report: _tap_report,

    _withTest(test, cb) {
      return tap_go.then(() => !cb || test.omit ? null : cb(test)) },

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

  test.serial = tap.serial
  test.only = tap.only
  test.skip = tap.skip
  test.todo = tap.todo
  test.failing = tap.failing
  test.cb = tap.test_cb

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
      try {
        lines = Object.keys(extra)
          .map(k => _tap_asYamlExtra(k, extra[k]) )
          .filter(e => e)
      } catch (err) { if (!err instanceof TypeError) throw err }

    if (lines.length) {
      lines = lines.join('\n').split('\n')
      lines.push('')
    } else if (!debug_inspect && extra.stack)
      lines = [].concat(extra.stack)
    else if (extra.toString)
      lines = extra.toString().split(/\r?\n/)

    if (debug_inspect)
      lines = lines.concat(debug_inspect(extra).split(/\r?\n/).map(l => '# '+l))

    lines.unshift('')
    out += `\n  ---${lines.join('\n  ')}\n`
  }
  return out
}

