# tap-lite-tester
TAP lightweight testing with no dependencies


### Installation

```bash
$ npm install tap-lite-tester
```

### API

```javascript
tap.start(count)
tap.plan(count)
tap.addPlans(inc_count)
tap.finish(count, setExitCode=setExitCode_p)

tap.test(title, cb)
tap.test_cb(title, cb)
tap.serial(title, cb)
tap.only(title, cb)
tap.skip(title, cb, reason)
tap.todo(title, cb, reason)
tap.failing(title, cb, reason)
```

Test callback argument supports all functions of the [assert](https://nodejs.org/dist/latest/docs/api/assert.html) library, as well as ::

```javascript
t.promiseResolves(aPromise, message)
t.promiseRejects(aPromise, message)
t.asyncThrows(asyncBlock, error, message)
```

### Example

See `examples/` for using tap-lite-tester. Self-hosting for the win!
