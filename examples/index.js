'use strict'
Object.assign(exports, {
  add(x,y) { return Promise.resolve(x+y) },
  mul(x,y) { return Promise.resolve(x*y) },
  ident(x) { return Promise.resolve(x) },
})
