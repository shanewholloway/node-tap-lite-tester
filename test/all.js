'use strict'
//const runTests = require('tap-lite-tester/runner')
const runTests = require('../runner')
if (module === require.main)
  runTests(process.argv.slice(2))
    .catch(err => console.error(err))

