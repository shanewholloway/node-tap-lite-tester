'use strict'
const inspect = require('util').inspect

module.exports = exports = createTAP(true)
function createTAP(setExitCode_p) {
  let summary = {success: null, total_pass: 0, total_fail: 0}
  let tap = {
    createTAP,
    summary,
    results: [summary],
    output: [],

    start(count) {
      tap._output("TAP version 13")
      if (count) tap.plan(count) },

    plan(count) { 
      summary.planned = count
      tap._output(`1..${count}`) },

    skip(title, cb) {
      let test = {title, directive: 'SKIP', idx: ++tap._tap_idx}
      return tap._addTestPromise(
        Promise.resolve(test)
          .then(() => tap._result(true, test)))
    },

    todo(title, cb) {
      let test = {title, directive: 'TODO', idx: ++tap._tap_idx}
      return tap._addTestPromise(
        Promise.resolve(test)
          .then(() => tap._result(false, test)))
    },

    test(title, cb) {
      let test = {title, idx: ++tap._tap_idx}
      return tap._addTestPromise(
        Promise.resolve(test).then(cb)
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

      let out = tap._report(success, test, extra)
      if (test.idx)
        tap.results[test.idx] = extra===undefined ? {success, test} : {success, test, extra}
      tap._output(out)
    },
    _report: _tap_report,

    _addTestPromise(promise) {
      tap._all_tests.push(promise)
      return promise },

    _checkPlannedCount() {
      if (summary.planned == tap._tap_idx) return true
      if (summary.planned == null) return true
      tap._result(false, {title: `TAP planned for ${summary.planned}, but registered ${tap._tap_idx} tests`, idx: 'plan'})
      return false },
  }
  return Object.defineProperties(tap, 
    {_all_tests: {value: [], writable: true},
     _tap_idx: {value: 0, writable: true}})
}


function _tap_asYamlExtra(key, value) {
  if (!Array.isArray(value))
    return `${key}: ${JSON.stringify(value)}`

  let lines = value.map(ea => JSON.stringify(ea))
  lines.unshift('')
  return `${key}:\n${lines.join()}\n`
}


function _tap_report(success, test, extra) {
  let out = [
    success ? 'ok' : 'not ok',
    Number(test.idx),
    `- ${test.title}`]

  if (test.directive)
    out.push(`# ${test.directive}`)

  out = out.filter(v=>v).join(' ')

  if (extra!=null) {
    let lines

    if ('string' === typeof extra)
      lines = extra.split(/\r?\n/)

    else if ('object' === typeof extra)
      lines = Object.keys(extra)
        .map(k => _tap_asYamlExtra(k, extra[k]) )
        .filter(e => e)

    if (lines.length)
      lines = lines.join('\n').split('\n')
    else
      lines = inspect(extra).split(/\r?\n/).map(l => '# '+l)

    lines.unshift('')
    out += `\n  ---${lines.join('\n  ')}\n`
  }
  return out
}

