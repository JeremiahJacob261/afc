const fs = require('fs');

const file = 'locales/my/common.json';
const locale = JSON.parse(fs.readFileSync(file, 'utf8'));

const setValue = (path, value) => {
  const parts = path.split('.');
  let node = locale;
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== 'object' || node[part] === null) node[part] = {};
    node = node[part];
  }
  node[parts[parts.length - 1]] = value;
};

// --- Missing keys: translate to Burmese ---
setValue('auth.register.searchCountry', 'နိုင်ငံ သို့မဟုတ် ကုဒ် ရှာပါ');
setValue('auth.register.termsLink', 'စည်းမျဉ်းများ');
setValue('auth.register.and', 'နှင့်');
setValue('auth.register.privacyLink', 'ကိုယ်ရေးအချက်အလက် မူဝါဒ');

setValue('messages.withdrawalPending', 'သင်၏ ယခင် ငွေထုတ်ယူတောင်းဆိုမှုသည် စောင့်ဆိုင်းဆဲဖြစ်ပါသည်။ ပြီးစီးသည် သို့မဟုတ် ငြင်းပယ်သည်အထိ စောင့်ဆိုင်းပေးပါ။');
setValue('messages.paymentRequestPending', 'သင့်တွင် စောင့်ဆိုင်းဆဲ ငွေသွင်း သို့မဟုတ် ငွေထုတ်တောင်းဆိုမှု ရှိပြီးဖြစ်ပါသည်။ ၎င်းကို ဆောင်ရွက်ပြီးမှသာ နောက်တစ်ခု တင်သွင်းပေးပါ။');
setValue('messages.withdrawalCooldown', 'ယခင် အောင်မြင်သော ငွေထုတ်ယူမှုပြီးနောက် ၂၄ နာရီ စောင့်ရပါမည်။');
setValue('messages.withdrawalAvailableAt', '{{time}} ပြီးနောက် ငွေထုတ်ယူနိုင်ပါမည်။');

setValue('mobile.home.whatsapp', 'WhatsApp အဖွဲ့');
setValue('mobile.home.whatsappCopy', 'ကျွန်တော်တို့၏ WhatsApp အဖွဲ့သို့ ဝင်ရောက်ပါ');
setValue('mobile.profile.whatsappGroup', 'WhatsApp အဖွဲ့');
setValue('mobile.transactions.usdtEquivalent', 'MMK တန်ဖိုး');

setValue('legal.common.backToEfc', 'UCL သို့ ပြန်သွားရန်');
setValue('legal.common.lastUpdated', 'နောက်ဆုံး ပြင်ဆင်သည့်ရက် - ဇွန် ၂၅၊ ၂၀၂၆');

setValue('legal.terms.title', 'စည်းမျဉ်းများ');
setValue('legal.terms.description', 'UCL အသုံးပြုခြင်းအတွက် စည်းမျဉ်းများ။');
setValue('legal.terms.intro', 'UCL အကောင့်များသည် ၎င်းတို့ တည်ရှိရာဒေသတွင် ဘောလုံးစျေးကွက်နှင့် ပိုက်ဆံအိတ် ဝန်ဆောင်မှုများကို တရားဝင် အသုံးပြုခွင့်ရှိသော လူကြီးများအတွက်သာ ဖြစ်ပါသည်။ အသက် ၁၈ နှစ်အောက်ဖြစ်ပါက သို့မဟုတ် သင်နေထိုင်ရာတွင် ဤဝန်ဆောင်မှု ကန့်သတ်ထားပါက အကောင့်မဖွင့်ပါနှင့်။');
setValue('legal.terms.account', 'သင်၏ ဝင်ရောက်မှုအသေးစိတ်ကို လျှို့ဝှက်ထားရန်၊ မှန်ကန်သော အကောင့်အချက်အလက်များသာ အသုံးပြုရန်နှင့် ငွေထည့်သွင်းခြင်း သို့မဟုတ် စျေးကွက်ဝင်ရောက်မှု မပြုမီ အန္တရာယ်များကို နားလည်ရန် သင့်တာဝန်ဖြစ်ပါသည်။ UCL သည် ဤဝဘ်ဆိုဒ်ပြင်ပတွင် သင်၏ စကားဝှက်ကို တောင်းဆိုမည်မဟုတ်ပါ။');
setValue('legal.terms.restrictions', 'ပရိုမိုးရှင်းများ၊ ဆုကြေးများ၊ ငွေထုတ်ယူမှုများနှင့် အကောင့်ဝင်ရောက်ခွင့်တို့ကို အတည်ပြုခြင်း၊ လိမ်လည်မှု ကာကွယ်ခြင်း၊ ဒေသနိုင်ငံဥပဒေနှင့် ပလက်ဖောင်းစည်းမျဉ်းများအရ ကန့်သတ်နိုင်ပါသည်။ စာမျက်နှာ၊ စာတို သို့မဟုတ် လင့်ခ်တစ်ခုခုသည် သံသယဖြစ်ဖွယ်ဟု ယူဆပါက ရပ်တန့်ပြီး တရားဝင် အက်ပ်အတွင်း ပံ့ပိုးမှုလမ်းကြောင်းမှတစ်ဆင့် အကူအညီတောင်းပါ။');

setValue('legal.privacy.title', 'ကိုယ်ရေးအချက်အလက် မူဝါဒ');
setValue('legal.privacy.description', 'UCL အကောင့်များအတွက် ကိုယ်ရေးအချက်အလက် အချက်အလက်များ။');
setValue('legal.privacy.collection', 'UCL သည် အကောင့်ဖွင့်ခြင်း၊ အကောင့်ဆိုင်ရာ ဆောင်ရွက်ချက်များ ဆောင်ရွက်ခြင်းနှင့် လိမ်လည်မှု သို့မဟုတ် ခွင့်ပြုချက်မရှိဘဲ ဝင်ရောက်မှုမှ အသုံးပြုသူများကို ကာကွယ်နိုင်ရန် အသုံးပြုသူအမည်၊ အီးမေးလ်လိပ်စာ၊ ဖုန်းနံပါတ်၊ နိုင်ငံကုဒ်၊ ရည်ညွှန်းကုဒ်၊ ပိုက်ဆံအိတ် လှုပ်ရှားမှုနှင့် အထောက်အထားပြုချက် အချက်အလက်များကဲ့သို့ အကောင့်အချက်အလက်များကို စုဆောင်းပါသည်။');
setValue('legal.privacy.storage', 'အကောင့်အချက်အလက်များကို အက်ပ်မှ အသုံးပြုသော ဝန်ဆောင်မှုပေးသူများထံတွင် သိမ်းဆည်းထားပြီး၊ အထောက်အထားပြုခြင်းနှင့် ဒေတာဘေ့စ် ဝန်ဆောင်မှုများအတွက် Supabase အပါအဝင် ဖြစ်ပါသည်။ အုပ်ချုပ်ရေးကိရိယာများ ဝင်ရောက်ခွင့်ကို ခွင့်ပြုချက်ရှိ ဝန်ထမ်းများအတွက်သာ ကန့်သတ်ထားသင့်ပါသည်။');
setValue('legal.privacy.contact', 'အခြားသူ၏ ကိုယ်ရေးအချက်အလက်များကို တင်သွင်းခြင်း မပြုပါနှင့်။ အကောင့်အကူအညီ လိုအပ်ပါက သို့မဟုတ် သင်၏ ဒေတာကို ပြန်လည်စစ်ဆေးစေလိုပါက တရားဝင် အက်ပ်အတွင်း ပံ့ပိုးမှုလမ်းကြောင်းမှတစ်ဆင့် ဆက်သွယ်ပါ။');

// --- Rework existing values with leftover English words or outdated currency ---
setValue('auth.register.referralCode', 'ရည်ညွှန်းကုဒ်');
setValue('auth.register.terms', 'အသက် အနည်းဆုံး ၁၈ နှစ်ပြည့်ပြီး UCL စည်းမျဉ်းများကို လက်ခံသဘောတူပါသည်။');
setValue('forms.chooseWallet', 'ငွေထည့်သွင်းရန် ပိုက်ဆံအိတ်ကို ရွေးချယ်ပါ');
setValue('messages.emailExists', 'အီးမေးလ်လိပ်စာ ရှိပြီးသားဖြစ်ပါသည်!');
setValue('messages.resetEmailSent', 'စကားဝှက် ပြန်လည်သတ်မှတ်ရန် အီးမေးလ် ပို့ပြီးပါပြီ။ သင့် ဝင်စာပုံးကို စစ်ဆေးပါ။');
setValue('messages.resetEmailSentTitle', 'စကားဝှက် ပြန်လည်သတ်မှတ်ရန် အီးမေးလ် ပို့ပြီးပါပြီ');
setValue('messages.unableLoadMatches', 'ဂိမ်းများကို ဖတ်ရှု၍ မရနိုင်ပါ။');
setValue('messages.unableLoadMatch', 'ဂိမ်းကို ဖတ်ရှု၍ မရနိုင်ပါ။');
setValue('messages.unableLoadBets', 'လောင်းကြေးများကို ဖတ်ရှု၍ မရနိုင်ပါ။');
setValue('messages.unableLoadBet', 'လောင်းကြေးကို ဖတ်ရှု၍ မရနိုင်ပါ။');
setValue('messages.unableLoadProfile', 'ပရိုဖိုင်ကို ဖတ်ရှု၍ မရနိုင်ပါ။');
setValue('messages.stakeMinimum', 'စတော့အား အနည်းဆုံး 5,000 MMK ဖြစ်ရပါမည်။');
setValue('messages.minimumWithdrawal', 'အနည်းဆုံး ထုတ်ယူမှုမှာ {{amount}} MMK ဖြစ်ပါသည်။');
setValue('messages.depositSubmittedWithAmount', 'သင်၏ {{amount}} MMK အတွက် ငွေသွင်းအထောက်အထား တင်သွင်းပြီးဖြစ်ပြီး အုပ်ချုပ်သူ၏ အတည်ပြုချက်ကို စောင့်ဆိုင်းနေပါသည်။');
setValue('messages.unableLoadVip', 'VIP တိုးတက်မှုကို ဖတ်ရှု၍ မရနိုင်ပါ။');
setValue('messages.enterTransactionPin', 'သင့် ငွေလွှဲ PIN ကို ထည့်ပါ။');
setValue('mobile.pin.warning', 'သင့် ငွေလွှဲ PIN ကို သတ်မှတ်ပြီးပါက အက်ပ်အတွင်းတွင် ပြောင်းလဲ၍ မရပါ။');
setValue('mobile.match.insufficientBalance', 'ဤလောင်းကြေးကို ပြီးစီးရန် MMK မလုံလောက်ပါ။');
setValue('mobile.deposit.fcfaEquivalent', 'MMK တန်ဖိုး');
setValue('mobile.deposit.usdtEquivalent', 'MMK တန်ဖိုး');
setValue('mobile.transactions.fcfaEquivalent', 'MMK တန်ဖိုး');
setValue('mobile.withdraw.totalDebit', 'စုစုပေါင်း နုတ်ယူငွေ - {{amount}} MMK');
setValue('mobile.withdraw.amountLabel', 'MMK ဖြင့် ထုတ်ယူလိုသော ပမာဏကို ထည့်ပါ');
setValue('mobile.withdraw.maximumWithdrawal', 'အများဆုံး ထုတ်ယူမှုမှာ {{amount}} MMK ဖြစ်ပါသည်။');
setValue('mobile.deposit.minShort', 'အနည်းဆုံး {{amount}} {{currency}}');
setValue('mobile.deposit.minimumPlaceholder', 'အနည်းဆုံး {{amount}} {{currency}}');
setValue('messages.minimumDeposit', 'အနည်းဆုံး ငွေသွင်းမှုမှာ {{amount}} {{currency}} ဖြစ်ပါသည်။');
setValue('mobile.deposit.sendExactly', 'အောက်ပါ ငွေပေးချေမှု အချက်အလက်များသို့ {{amount}} အတိအကျ ပို့ပါ။');

setValue('landing.hero.boardFootnote', 'ပြန်လည်ရရှိငွေကို ထိုးငွေ၏ ရာခိုင်နှုန်းအမှတ်အသားဖြင့် ပြသထားပါသည်။ ကုမ္ပဏီဈေးကွက်များက ထိုးငွေကို ပြန်လည်ပေးအပ်ပါသည်။');
setValue('landing.live.odds', 'အချိုးအစားများ');
setValue('landing.agents.salaryAlt', 'ဥရောပ ဘောလုံးအသင်းများ အေးဂျင့် လစာအဆင့်များ - အေးဂျင့် A မှ အေးဂျင့် G အထိ');

setValue('mobile.nav.label', 'ပင်မ လမ်းညွှန်မှု');
setValue('mobile.bets.cancelNote', 'ဤလောင်းကြေးကို ပယ်ဖျက်လိုပါက ဖယ်ရှားရန် အုပ်ချုပ်သူကို ဆက်သွယ်ပါ');
setValue('mobile.profile.referrals', 'ဖိတ်ကြားမှုများ');
setValue('mobile.deposit.subtitle', 'နည်းလမ်းရွေးပါ၊ ငွေပေးချေပါ၊ ပြီးလျှင် ငွေသွင်းအထောက်အထား တင်ပါ။');
setValue('mobile.deposit.noMethods', 'ယခုအချိန်တွင် ငွေသွင်းနည်းလမ်း မရှိပါ။ ပံ့ပိုးမှုကို ဆက်သွယ်ပါ။');
setValue('mobile.deposit.noPaymentAddress', 'ဤနည်းလမ်းအတွက် ယခု ငွေပေးချေလိပ်စာ မရှိပါ။ ပံ့ပိုးမှုကို ဆက်သွယ်ပါ။');
setValue('mobile.deposit.receiptUpload', 'ငွေသွင်းအထောက်အထား တင်ရန်');
setValue('mobile.deposit.browseReceiptImage', 'ငွေသွင်းအထောက်အထား ပုံရွေးပါ');
setValue('mobile.deposit.receiptHint', 'PNG၊ JPG သို့မဟုတ် စက်ရုပ်ဖမ်းပုံ');
setValue('mobile.deposit.removeReceipt', 'ငွေသွင်းအထောက်အထား ဖယ်ရှားရန်');
setValue('mobile.withdraw.bindWallet', 'ပိုက်ဆံအိတ် ချိတ်ဆက်ရန်');
setValue('mobile.withdraw.chooseWallet', 'နှစ်သက်ရာ ငွေပေးချေ ပိုက်ဆံအိတ်ကို ရွေးချယ်ပါ');
setValue('mobile.withdraw.connectionError', 'သင်၏ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ဝဘ်ဆိုဒ်ကို ပြန်လည်စတင်ပါ။');
setValue('mobile.transactions.receiptUploaded', 'ငွေသွင်းအထောက်အထား တင်ပြီးပါပြီ');
setValue('mobile.transactions.methodMissingRate', '{{currency}} ငွေထုတ်ပေးချေမှု မရနိုင်ပါ - လဲလှယ်နှုန်း မရှိပါ');
setValue('mobile.notifications.titles.rebateBonus', 'ငွေပြန်အမ်း ဆုကြေး');
setValue('mobile.notifications.titles.referralDepositBonus', 'ရည်ညွှန်း ငွေသွင်း ဆုကြေး');
setValue('mobile.notifications.titles.bonus', 'ဆုကြေး');
setValue('mobile.notifications.titles.firstDepositBonus', 'ပထမဆုံး ငွေသွင်း ဆုကြေး');
setValue('mobile.notifications.titles.adminReward', 'အုပ်ချုပ်သူ ဆု');
setValue('mobile.notifications.messages.rebateBonus', '{{sourceUsername}} မှ {{amount}} ငွေပြန်အမ်း ဆုကြေး ရရှိပါသည်');
setValue('mobile.notifications.messages.referralDepositBonus', '{{sourceUsername}} မှ {{amount}} ငွေသွင်း ဆုကြေး ရရှိပါသည်');
setValue('mobile.notifications.messages.bonus', '{{amount}} ဆုကြေး ရရှိပါသည်');
setValue('mobile.notifications.messages.firstDepositBonus', 'ပထမဆုံး ငွေသွင်း ဆုကြေး {{amount}} ရရှိပါသည်');
setValue('mobile.notifications.messages.adminReward', 'အုပ်ချုပ်သူထံမှ {{amount}} {{method}} ရရှိပါသည်');
setValue('mobile.notifications.events.test_push.message', 'ဤစက်တွင် အသိပေးချက်များ အသင့်ဖြစ်ပါပြီ။');
setValue('user.pages.matches', 'ပွဲစဉ်များ');
setValue('admin.common.copy', 'ကူးယူမည်');
setValue('admin.common.pending', 'စောင့်ဆိုင်းဆဲ');

// --- New keys for the dashboard shell (cover.js) and mobile language row ---
setValue('user.nav.home', 'ပင်မ');
setValue('user.nav.matches', 'ပွဲစဉ်များ');
setValue('user.nav.bets', 'လောင်းကြေးများ');
setValue('user.nav.wallet', 'ပိုက်ဆံအိတ်');
setValue('user.nav.more', 'နောက်ထပ်');
setValue('user.shell.dashboardNavigation', 'ဒက်ရှ်ဘုတ် လမ်းညွှန်မှု');
setValue('user.shell.mobileNavigation', 'မိုဘိုင်း လမ်းညွှန်မှု');
setValue('user.shell.notifications', 'အကြောင်းကြားချက်များ');
setValue('user.shell.offlineTitle', 'သင် အော့ဖ်လိုင်း ဖြစ်နေပါသည်။');
setValue('user.shell.offlineTransactions', 'ပြန်လည်ချိတ်ဆက်မှု မပြုမီ ငွေစာရင်းများကို ကြည့်ရှု၍ မရပါ။');
setValue('user.shell.offlineLive', 'ပြန်လည်ချိတ်ဆက်သည်နှင့် တစ်ပြိုင်နက် တိုက်ရိုက်အချက်အလက်များ ပြန်လည်ပြသပါမည်။');
setValue('user.shell.depositDraft', 'သိမ်းဆည်းထားသော ငွေသွင်း မူကြမ်း - {{amount}}');
setValue('mobile.profile.languageValue', 'မြန်မာ');

setValue('common.brandFull', 'UCL \u1018\u1031\u102c\u101c\u102f\u1038');
setValue('common.brandCompany', 'UCL \u1018\u1031\u102c\u101c\u102f\u1038');
setValue('mobile.match.matchId', '\u1015\u103d\u1032\u1005\u1009\u103a\u1021\u1019\u103e\u1010\u103a');
setValue('mobile.bets.matchId', '\u1015\u103d\u1032\u1005\u1009\u103a\u1021\u1019\u103e\u1010\u103a');
setValue('mobile.bets.betId', '\u101c\u1031\u102c\u1004\u103a\u1038\u1000\u103c\u1031\u1038\u1021\u1019\u103e\u1010\u103a');
setValue('mobile.transactions.metaDescription', 'UCL \u1018\u1031\u102c\u101c\u102f\u1038 \u1004\u103d\u1031\u1015\u1031\u1038\u1001\u103b\u1031\u1019\u103e\u102f\u1019\u103e\u1010\u103a\u1010\u1019\u103a\u1038');

fs.writeFileSync(file, JSON.stringify(locale, null, 2).replace(/\n/g, '\r\n') + '\r\n');
console.log('updated', file);
