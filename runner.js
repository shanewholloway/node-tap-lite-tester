'use strict'
// Note: this module does not need minification because it is intended to be used in Node v6+

const g_tap = require('./tap-lite-tester.js')
const {fork} = require('child_process')
const {resolve: path_resolve} = require('path')

module.exports = exports = runTests
function runTests(testFileList, args, options) {
  if (!testFileList || !testFileList.length)
    throw new Error("No test files specified. Try using process.argv.slice(2)")

  if (null == args) args = []

  if (!options) options = {}
  if (!options.env) options.env = {}
  if (!options.env.NODE_TEST_RUNNER)
    options.env.NODE_TEST_RUNNER = 'tap-lite-test/runner'

  let tap = options.tap || g_tap
  tap.start(testFileList.length)
  return testFileList
    .reduce((tip, fn) =>
        tip.then(() =>
          tap.test(`Run tests in "${fn}"`, () =>
            runOneTest(path_resolve(fn), args, options))),
      Promise.resolve())
    .then(() => tap.finish()) }


const _finish_nd_buffer = buf_data =>
  buf_data.length ? buf_data.join('').split(/\r?\n/) : []

runTests.runOneTest = runOneTest
function runOneTest(testFile, args, options) {
  options.silent = true
  return new Promise((resolve, reject) => {
    let child = fork(testFile, args, options)
    let stdout=[], stderr=[]

    child.stdout.on('data', data => stdout.push(data))
    child.stderr.on('data', data => stdout.push(data))
    child.on('error', reject)
    child.on('close', exitCode => {
      let ans = {exitCode, testFile,
        stdout: _finish_nd_buffer(stdout),
        stderr: _finish_nd_buffer(stderr)}
      return exitCode ? reject(ans) : resolve(ans) }) })}


if (module === require.main)
  runTests(process.argv.slice(2))
    .catch(err => console.error(err))

