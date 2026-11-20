// Run once after `cap add android`. Sets up what the generated Android
// project doesn't know on its own:
//  - phones play upright only (a sideways phone would see further ahead);
//    tablets turn freely, since the game caps how far ahead any screen sees.
//    Same rule as the iPhone/iPad app.
//  - the version: versionCode from VERSION_CODE (the build number, which
//    Google Play needs to go up with every upload) and versionName from
//    package.json.
//  - signing with the Play upload key, when the build has one
//    (ANDROID_KEYSTORE_PATH and ANDROID_KEYSTORE_PASSWORD).
const fs = require('fs');
const path = require('path');

const ANDROID = path.join(__dirname, '..', 'android');
const appId = require('../capacitor.config.json').appId;
const version = require('../package.json').version;

const fail = (msg) => {
  console.error('::error::' + msg);
  process.exit(1);
};

// 1. Orientation, decided when the app opens
const activity = path.join(ANDROID, 'app', 'src', 'main', 'java', ...appId.split('.'), 'MainActivity.java');
if (!fs.existsSync(activity)) fail('Could not find MainActivity.java at ' + activity);
fs.writeFileSync(
  activity,
  `package ${appId};

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Phones play upright only; tablets (600dp and wider) can turn freely.
        if (getResources().getConfiguration().smallestScreenWidthDp < 600) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT);
        }
        super.onCreate(savedInstanceState);
    }
}
`
);

// 2 and 3. Version and signing in app/build.gradle
const gradleFile = path.join(ANDROID, 'app', 'build.gradle');
let g = fs.readFileSync(gradleFile, 'utf8');
const swap = (re, to, what) => {
  if (!re.test(g)) fail('Could not set ' + what + ' in app/build.gradle');
  g = g.replace(re, to);
};
swap(/versionCode \d+/, 'versionCode((System.getenv("VERSION_CODE") ?: "1").toInteger())', 'the version code');
swap(/versionName "[^"]*"/, `versionName "${version}"`, 'the version name');
swap(
  /buildTypes \{\s*release \{/,
  `signingConfigs {
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storeType "pkcs12"
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias "upload"
                keyPassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                signingConfig signingConfigs.release
            }`,
  'signing'
);
fs.writeFileSync(gradleFile, g);
console.log('Android project prepared: orientation, version ' + version + ', signing');
