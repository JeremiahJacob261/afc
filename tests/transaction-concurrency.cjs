// Isolated Docker database only. Never points at the production database.
const { spawn, spawnSync } = require('node:child_process')
const { randomUUID } = require('node:crypto')
const assert = require('node:assert/strict')
const env = { ...process.env }
for (const name of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']) delete env[name]
const args = ['--host=unix:///var/run/docker.sock', 'exec', '-i', 'afc-transaction-db', 'psql', '-U', 'postgres', '-d', 'afc_test', '-At', '-v', 'ON_ERROR_STOP=1']
function sql(query) {
  return new Promise(resolve => {
    const child = spawn('docker', args, { env }); let out = '', error = ''
    child.stdout.on('data', data => { out += data }); child.stderr.on('data', data => { error += data })
    child.on('close', code => resolve({ code, out: out.trim(), error }))
    child.stdin.end(query)
  })
}
async function success(query) { const result = await sql(query); assert.equal(result.code, 0, result.error); return result.out }
function lock(query) {
  const child = spawn('docker', args, { env })
  const ready = new Promise(resolve => { child.stdout.on('data', data => { if (String(data).includes('locked')) resolve() }) })
  const done = new Promise(resolve => child.on('close', resolve))
  child.stdin.end(query)
  return { ready, done }
}

async function run() {
  const id = randomUUID(), id2 = randomUUID(), name = 'concurrent_' + id.replaceAll('-', ''), name2 = name + '_2'
  const match = 'concurrent_' + id, betId = randomUUID(), withdrawalId = randomUUID()
  await success(`INSERT INTO public.admin_settings(id,min_withdrawal_amount,max_withdrawal_amount,daily_withdrawal_limit,withdrawal_fee_percent,membership_balance_threshold,withdrawals_enabled)
    VALUES(1,50000,500000000,500000,7,8335,true) ON CONFLICT(id) DO NOTHING;
    SELECT public.provision_native_profile_atomic('${id}','${name}@example.invalid','${name}','9123456789','+95',null);
    SELECT public.provision_native_profile_atomic('${id2}','${name2}@example.invalid','${name2}','9123456789','+95',null);
    UPDATE public.users SET balance=1000000,codeset=true,pin='1234' WHERE userid IN ('${id}','${id2}');
    INSERT INTO public.bets(match_id,home,away,league,tsgmt,verified,nilnil) VALUES('${match}','Test home','Test away','Test league',(extract(epoch from now())*1000+86400000)::bigint,false,2);
    INSERT INTO public.walle(name,currency_code,rates,available,type) VALUES('${name}','usdt',1,true,'crypto');
    INSERT INTO public.user_wallets(uid,walletnames,wallet,bank,names) SELECT uid,'${name}','${name}_wallet','testbank','' FROM public.users WHERE userid='${id}';`)
  try {
    const bet = `SET ROLE service_role; SELECT public.place_native_bet_atomic('${id}','${match}','nilnil',5000,2,'${betId}');`
    const retries = await Promise.all(Array.from({ length: 10 }, () => sql(bet)))
    assert.ok(retries.every(result => result.code === 0), JSON.stringify(retries))
    assert.equal(await success(`SELECT count(*)||':'||min(stake)::text FROM public.placed WHERE betid='${betId}';`), '1:5000.0000')
    assert.equal(Number(await success(`SELECT balance FROM public.users WHERE userid='${id}';`)), 995000)

    const shared = lock(`BEGIN; SELECT 1 FROM public.bets WHERE match_id='${match}' FOR SHARE; SELECT 'locked'; SELECT pg_sleep(1.5); COMMIT;`)
    await shared.ready
    const start = performance.now()
    await success(`SET ROLE service_role; SELECT public.place_native_bet_atomic('${id2}','${match}','nilnil',5000,2,'${randomUUID()}');`)
    const parallelMs = Math.round(performance.now() - start)
    assert.ok(parallelMs < 1000, `Other bettors blocked by shared match lock: ${parallelMs} ms`)
    await shared.done

    const wrongOdds = await sql(`SET ROLE service_role; SELECT public.place_native_bet_atomic('${id}','${match}','nilnil',5000,99,'${randomUUID()}');`)
    assert.notEqual(wrongOdds.code, 0)
    assert.match(wrongOdds.error, /Odds changed/)
    assert.equal(Number(await success(`SELECT balance FROM public.users WHERE userid='${id}';`)), 995000)

    const withdrawal = `SET ROLE service_role; SELECT public.submit_withdrawal_atomic('${id}',50000,'1234','${name}_wallet','usdt',null,null,'${withdrawalId}',1,7);`
    const requests = await Promise.all(Array.from({ length: 10 }, () => sql(withdrawal)))
    assert.ok(requests.every(result => result.code === 0), JSON.stringify(requests))
    assert.equal(Number(await success(`SELECT count(*) FROM public.notification WHERE username='${name}' AND type='withdraw';`)), 1)
    assert.equal(Number(await success(`SELECT balance FROM public.users WHERE userid='${id}';`)), 941500)

    const settlement = lock(`BEGIN; SELECT 1 FROM public.bets WHERE match_id='${match}' FOR UPDATE; SELECT 'locked'; SELECT pg_sleep(.5); UPDATE public.bets SET verified=true,results='0 - 0' WHERE match_id='${match}'; COMMIT;`)
    await settlement.ready
    const rejected = await sql(`SET ROLE service_role; SELECT public.place_native_bet_atomic('${id2}','${match}','nilnil',5000,2,'${randomUUID()}');`)
    assert.notEqual(rejected.code, 0)
    assert.match(rejected.error, /already settled/)
    await settlement.done
    await success(bet) // An accepted attempt can still recover after settlement.
    assert.equal(Number(await success(`SELECT balance FROM public.users WHERE userid='${id}';`)), 941500)
    console.log(JSON.stringify({ pass: true, duplicateBetSubmissions: 10, duplicateWithdrawals: 10, parallelBetMs: parallelMs,
      checks: ['single debit','expected-odds rollback','shared match concurrency','settlement exclusion','replay after settlement'] }))
  } finally {
    await success(`DELETE FROM public.placed WHERE username IN ('${name}','${name2}'); DELETE FROM public.notification WHERE username='${name}';
      DELETE FROM public.user_wallets WHERE walletnames='${name}'; DELETE FROM public.walle WHERE name='${name}';
      DELETE FROM public.notification_jobs WHERE event_key IN ('team:${id}','team:${id2}','settlement:${match}');
      DELETE FROM public.bets WHERE match_id='${match}'; DELETE FROM public.referral WHERE refer IN (SELECT newrefer FROM public.users WHERE userid IN ('${id}','${id2}'));
      DELETE FROM public.users WHERE userid IN ('${id}','${id2}');`)
  }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
