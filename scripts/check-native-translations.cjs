const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const {languages} = require('../lib/languages.json')
const root = path.resolve(__dirname, '../android/native/app/src/main/res')
function strings(file) {
 const content=fs.readFileSync(file,'utf8')
 return Object.fromEntries([...content.matchAll(/<string\b([^>]*)>([\s\S]*?)<\/string>/g)].map(match=>{
  const name=match[1].match(/\bname="([^"]+)"/)
  assert.ok(name,`${file}: string name missing`)
  return [name[1],{text:match[2],fixed:/\btranslatable="false"/.test(match[1])}]
 }))
}
function variables(text) { return [...text.matchAll(/%(?:\d+\$)?(?:\.\d+)?[dsf]|%%/g)].map(x=>x[0]).sort() }
const source=strings(path.join(root,'values/strings.xml'))
for (const {code} of languages.filter(x=>x.code!=='en')) {
 const file=path.join(root,`values-${code}/strings.xml`)
 const translated=strings(file)
 assert.deepEqual(Object.keys(translated).sort(),Object.keys(source).sort(),`${code}: native string keys differ`)
 for (const [key,value] of Object.entries(source)) {
  assert.ok(translated[key].text.trim(),`${code}: ${key} is empty`)
  assert.deepEqual(variables(translated[key].text),variables(value.text),`${code}: ${key} formatting variables differ`)
  if(value.fixed) assert.equal(translated[key].text,value.text,`${code}: ${key} must not be translated`)
 }
}
console.log(`Native translations passed: ${languages.length} languages, ${Object.keys(source).length} strings each.`)
