// Run once after `cap add ios`: sets the Info.plist keys the generated Xcode
// project doesn't know about on its own - display name; portrait only on
// iPhone (a sideways phone used to see further ahead); every orientation on
// iPad, where landscape plays best and the game caps how far ahead any screen
// sees; full screen on iPad (no Split View or Stage Manager windows, which
// could be phone-sized and sideways); and no export-compliance question on
// each upload (the app only uses Apple's built-in HTTPS, and in fact makes no
// network calls at all).
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
setKey(
  'UISupportedInterfaceOrientations~ipad',
  '<array><string>UIInterfaceOrientationPortrait</string><string>UIInterfaceOrientationPortraitUpsideDown</string><string>UIInterfaceOrientationLandscapeLeft</string><string>UIInterfaceOrientationLandscapeRight</string></array>'
);
setKey('UIRequiresFullScreen', '<true/>');
setKey('ITSAppUsesNonExemptEncryption', '<false/>');
setKey('UIStatusBarStyle', '<string>UIStatusBarStyleLightContent</string>');

fs.writeFileSync(plist, s);
console.log('Info.plist prepared');
