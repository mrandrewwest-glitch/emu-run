// Run once after `cap add ios`: sets the Info.plist keys the generated Xcode
// project doesn't know about on its own - display name, portrait only (the
// game is played upright, and a sideways screen would see further ahead),
// full screen on iPad (needed for a portrait-only app to pass upload checks),
// and no export-compliance question on each upload (the app only uses
// Apple's built-in HTTPS, and in fact makes no network calls at all).
const fs = require('fs');
const path = require('path');

const plist = path.join(__dirname, '..', 'ios', 'App', 'App', 'Info.plist');
let s = fs.readFileSync(plist, 'utf8');

const setKey = (key, xml) => {
  const re = new RegExp(`<key>${key.replace('~', '\\~')}</key>\\s*(<array>[\\s\\S]*?</array>|<[^>]+/>|<[^>]+>[^<]*</[^>]+>)`);
  s = re.test(s)
    ? s.replace(re, `<key>${key}</key>\n\t${xml}`)
    : s.replace(/<\/dict>\s*<\/plist>/, `\t<key>${key}</key>\n\t${xml}\n</dict>\n</plist>`);
};

setKey('CFBundleDisplayName', '<string>Emu Run</string>');
setKey('UISupportedInterfaceOrientations', '<array><string>UIInterfaceOrientationPortrait</string></array>');
setKey('UISupportedInterfaceOrientations~ipad', '<array><string>UIInterfaceOrientationPortrait</string><string>UIInterfaceOrientationPortraitUpsideDown</string></array>');
setKey('UIRequiresFullScreen', '<true/>');
setKey('ITSAppUsesNonExemptEncryption', '<false/>');
setKey('UIStatusBarStyle', '<string>UIStatusBarStyleLightContent</string>');

fs.writeFileSync(plist, s);
console.log('Info.plist prepared');
