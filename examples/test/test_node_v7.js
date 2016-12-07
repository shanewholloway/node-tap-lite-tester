'use strict'
let obj = {a: 'apple', b: 1942, c: ['one', 'two', 'three']}

console.log('keys', Object.keys(obj))
console.log('values', Object.values(obj))
console.log('entries', Object.entries(obj))

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms))

async function afn() {
  console.log('pre-sleep', new Date())
  await sleep(100)
  console.log('post-sleep', new Date())
}

afn().then(ans =>
  console.log("Done with async/await based function"))

