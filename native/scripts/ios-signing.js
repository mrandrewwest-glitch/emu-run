// Signing for the cloud iPhone build, without a Mac or a registered test
// device. Uses the App Store Connect API key to:
//   setup    make a one-off App Store distribution certificate and
//            provisioning profile for this build, and install them on the
//            build machine;
//   cleanup  remove both from the Apple account and the build machine
//            afterwards (a build already uploaded is not affected).
// Env: ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY (the .p8 contents),
// BUNDLE_ID (defaults to the appId in capacitor.config.json), RUNNER_TEMP,
// GITHUB_ENV, GITHUB_RUN_NUMBER.
const crypto = require('crypto'), fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const TMP = process.env.RUNNER_TEMP || os.tmpdir(), DIR = path.join(TMP, 'signing'), STATE = path.join(DIR, 'state.json'), KEYCHAIN = path.join(DIR, 'build.keychain-db');
const BUNDLE = process.env.BUNDLE_ID || require('../capacitor.config.json').appId, SSL = '/usr/bin/openssl';
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
function token() {
  const now = Math.floor(Date.now() / 1000), head = `${b64({ alg: 'ES256', kid: process.env.ASC_KEY_ID, typ: 'JWT' })}.${b64({ iss: process.env.ASC_ISSUER_ID, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' })}`;
  return `${head}.${crypto.sign('sha256', Buffer.from(head), { key: process.env.ASC_PRIVATE_KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
}
async function api(method, p, body) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + p, { method, headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 204) return {};
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Apple said ${r.status} to ${method} ${p.split('?')[0]}: ${(j.errors || []).map((e) => e.detail || e.title).join('; ').slice(0, 400)}`);
  return j;
}
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const save = (s) => fs.writeFileSync(STATE, JSON.stringify(s));

async function setup() {
  fs.mkdirSync(DIR, { recursive: true });
  const state = {};
  save(state);
  const found = (await api('GET', `/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE)}&limit=200`)).data || [], bundle = found.find((b) => b.attributes.identifier === BUNDLE);
  if (!bundle) throw new Error(`The App ID ${BUNDLE} isn't registered yet (developer.apple.com, Identifiers).`);
  // a new private key and a request for a certificate; the key never leaves this machine
  const key = path.join(DIR, 'key.pem'), csr = path.join(DIR, 'csr.pem'), der = path.join(DIR, 'cert.der'), pem = path.join(DIR, 'cert.pem'), p12 = path.join(DIR, 'cert.p12'), pw = crypto.randomBytes(12).toString('hex');
  run(SSL, ['genrsa', '-out', key, '2048']);
  run(SSL, ['req', '-new', '-key', key, '-subj', '/CN=Emu Run cloud build', '-out', csr]);
  const cert = (await api('POST', '/v1/certificates', { data: { type: 'certificates', attributes: { certificateType: 'DISTRIBUTION', csrContent: fs.readFileSync(csr, 'utf8') } } })).data;
  state.cert = cert.id;
  save(state);
  fs.writeFileSync(der, Buffer.from(cert.attributes.certificateContent, 'base64'));
  run(SSL, ['x509', '-inform', 'DER', '-in', der, '-out', pem]);
  run(SSL, ['pkcs12', '-export', '-inkey', key, '-in', pem, '-out', p12, '-passout', 'pass:' + pw]);
  // a keychain just for this build
  run('security', ['create-keychain', '-p', pw, KEYCHAIN]);
  state.keychain = true;
  save(state);
  run('security', ['set-keychain-settings', '-lut', '21600', KEYCHAIN]);
  run('security', ['unlock-keychain', '-p', pw, KEYCHAIN]);
  run('security', ['import', p12, '-k', KEYCHAIN, '-P', pw, '-T', '/usr/bin/codesign', '-T', '/usr/bin/security']);
  run('security', ['set-key-partition-list', '-S', 'apple-tool:,apple:', '-s', '-k', pw, KEYCHAIN]);
  const others = run('security', ['list-keychains', '-d', 'user']).toString().split('\n').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
  run('security', ['list-keychains', '-d', 'user', '-s', KEYCHAIN, ...others]);
  // the App Store profile that ties the app, the certificate and its permissions together
  const name = `Emu Run cloud build ${process.env.GITHUB_RUN_NUMBER || Date.now()}`;
  const prof = (
    await api('POST', '/v1/profiles', {
      data: {
        type: 'profiles',
        attributes: { name, profileType: 'IOS_APP_STORE' },
        relationships: { bundleId: { data: { type: 'bundleIds', id: bundle.id } }, certificates: { data: [{ type: 'certificates', id: cert.id }] } },
      },
    })
  ).data;
  state.profile = prof.id;
  save(state);
  for (const d of [path.join(os.homedir(), 'Library/MobileDevice/Provisioning Profiles'), path.join(os.homedir(), 'Library/Developer/Xcode/UserData/Provisioning Profiles')]) {
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, `${prof.attributes.uuid}.mobileprovision`), Buffer.from(prof.attributes.profileContent, 'base64'));
  }
  for (const f of [key, csr, p12]) fs.rmSync(f, { force: true });
  if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, `PROFILE_NAME=${name}\n`);
  console.log('Signing is ready: certificate and profile made for', BUNDLE);
}
async function cleanup() {
  let state = {};
  try {
    state = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } catch {}
  for (const [what, p] of [['profile', state.profile && `/v1/profiles/${state.profile}`], ['certificate', state.cert && `/v1/certificates/${state.cert}`]]) {
    if (!p) continue;
    try {
      await api('DELETE', p);
      console.log('Removed the one-off', what);
    } catch (e) {
      console.log(`Couldn't remove the ${what}: ${e.message}`);
    }
  }
  if (state.keychain)
    try {
      run('security', ['delete-keychain', KEYCHAIN]);
    } catch {}
  fs.rmSync(DIR, { recursive: true, force: true });
}
(process.argv[2] === 'cleanup' ? cleanup() : setup()).catch((e) => {
  console.error('::error::' + e.message);
  process.exit(1);
});
