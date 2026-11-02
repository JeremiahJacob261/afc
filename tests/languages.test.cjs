const {test} = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const i18next = require('i18next')
const config = require('../lib/languages.json')
const next = require('../next-i18next.config')
function mobile(saved) {
 const instance=i18next.createInstance(), document={documentElement:{}}
 const filename=path.join(__dirname,'../mobile/src/i18n.js')
 const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 const loaded={exports:{}}
 const mocks={i18next:instance,'react-i18next':{initReactI18next:{type:'3rdParty',init(){}}},'../../lib/languages.json':config,'../../lib/accountCurrencyClient':{accountCurrencyPostProcessor:{type:'postProcessor',name:'accountCurrency',process:x=>x}},'./lib/storage.js':{getLocalStorageItem:(_key,fallback)=>saved??fallback}}
 new Function('require','module','exports','window','document',output)(id=>mocks[id]??require(path.resolve(path.dirname(filename),id)),loaded,loaded.exports,{},document)
 return {instance,document}
}
test('English is the default for website routes and a fresh mobile installation',()=>{
 assert.equal(next.i18n.defaultLocale,'en')
 assert.equal(next.fallbackLng,'en')
 const {instance,document}=mobile()
 assert.equal(instance.language,'en')
 assert.equal(document.documentElement.dir,'ltr')
})
test('all seven existing translations are available and saved choices survive initialization',()=>{
 assert.deepEqual(next.i18n.locales,['en','my','ar','es','fr','it','ru'])
 for(const language of next.i18n.locales){
  const {instance,document}=mobile(language)
  assert.equal(instance.language,language)
  assert.equal(document.documentElement.dir,language==='ar'?'rtl':'ltr')
 }
 assert.equal(mobile('unknown').instance.language,'en')
})
test('partial translations use their translated strings and fall back to English for missing content',()=>{
 const {instance}=mobile('ru')
 const ru=require('../locales/ru/common.json'),en=require('../locales/en/common.json')
 assert.equal(instance.t('common.signIn'),ru.common.signIn)
 assert.equal(instance.t('website.mmkStake'),en.website.mmkStake)
 assert.notEqual(instance.t('website.mmkStake'),'website.mmkStake')
})
