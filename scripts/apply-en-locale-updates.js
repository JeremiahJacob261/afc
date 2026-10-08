const fs = require('fs');
const file = 'locales/en/common.json';
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
setValue('user.nav.home', 'Home');
setValue('user.nav.matches', 'Matches');
setValue('user.nav.bets', 'Bets');
setValue('user.nav.wallet', 'Wallet');
setValue('user.nav.more', 'More');
setValue('user.shell.dashboardNavigation', 'Dashboard navigation');
setValue('user.shell.mobileNavigation', 'Mobile navigation');
setValue('user.shell.notifications', 'Notifications');
setValue('user.shell.offlineTitle', 'You are offline.');
setValue('user.shell.offlineTransactions', 'Transactions are unavailable until you reconnect.');
setValue('user.shell.offlineLive', 'Live information will refresh when you reconnect.');
setValue('user.shell.depositDraft', 'Saved deposit draft: {{amount}}');
setValue('mobile.profile.languageValue', 'Burmese');
fs.writeFileSync(file, JSON.stringify(locale, null, 2).replace(/\n/g, '\r\n') + '\r\n');
console.log('updated', file);
