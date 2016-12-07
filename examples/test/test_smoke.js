'use strict'
const tap = require('tap-lite-tester')
const module_under_test = require('../index')

tap.start()
tap.test('once', t => t.ok(true))
tap.test('twice', t => t.equal(1+1, 4-2))
tap.test('thrice', t => t.deepEqual([1,2,3], [6/6, 6/3, 6/2]))

tap.finish()
