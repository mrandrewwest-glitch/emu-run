# Emu Run

A Roadrunner-style side-scrolling runner. You're an emu legging it across the outback with a dingo on your tail.

Open `index.html` in any browser (phone or desktop). No build step, no dependencies.

The game is played with the phone upright. Every screen sees the same distance ahead, so a wide screen gives no advantage (extra width shows as a border). Upright, the sky above is filled with drifting sunset clouds, flocks of birds and the odd wedge-tailed eagle.. If a phone is turned sideways the game pauses and asks you to turn it back; on Android it also asks the browser to lock to portrait where that's allowed.

## Controls

| Touch | Keyboard | Move |
| --- | --- | --- |
| Tap | Space / Up | Jump over logs, rocks, termite mounds, wombats, goannas, kangaroos and cassowaries |
| Swipe down (hold to keep sliding) | Down (hold) | Duck under gum branches and swooping magpies, slide through long grass |
| Swipe right | Right | Zoomies dash: a burst of speed that smashes through saltbush (3.5 s cooldown) |

## How it works

- Hitting an obstacle lets the dingo close in. It drops back slowly while you run clean. If it catches you, the run is over.
- Running through long grass without sliding slows you down and lets the dingo gain.
- Collect quandong berries for points. A rare golden feather gives 5 seconds of invincibility.
- Score = metres run + 10 per berry + 25 per bush smashed.
- The top 5 scores are kept on the device (browser storage), with a name you can type in when you make the board.
- Get caught and the dingo burps, then rolls onto its back with its legs in the air and a huge round tummy, fast asleep among the emu feathers.
- The game gets faster the further you go, and new hazards appear: branches and termite mounds, then wombats and saltbush, then goannas, magpies, kangaroos and finally charging cassowaries. Fast animals get a flashing warning sign before they arrive.

## iPhone app (App Store / TestFlight)

The game is also built as an iPhone app, the same way as Bin Chicken. The
web game is unchanged. Everything app-specific lives in `native/` (a
Capacitor wrapper) and `.github/workflows/ios-testflight.yml`. No Mac is
needed: GitHub's Mac runners build and sign the app and upload it to App
Store Connect.

- `native/scripts/build-www.js` copies `index.html`, `manifest.webmanifest`
  and `icons/` into the app, and swaps the Google Fonts link for the fonts
  bundled in `native/fonts/`, so the app looks right with no connection.
- `native/scripts/prepare-ios.js` sets the app name, portrait only on
  iPhone, every orientation on iPad, full screen on iPad, a light status bar
  and no export-compliance question on upload.
- `native/scripts/ios-signing.js` makes a one-off signing certificate and
  App Store profile with the App Store Connect API key for each build, and
  removes both afterwards.
- `native/resources/` holds the app icon (no transparency, as Apple
  requires) and the launch screen. The build turns them into every size iOS
  needs.
- Inside the app, `index.html` adds a `native` class to the page. That keeps
  the game clear of the notch and home indicator and hides the keyboard
  hint. On the web `window.Capacitor` never exists, so nothing changes there.
- `privacy.html` is the privacy page for the App Store listing. It still
  needs a real contact email.

### iPad

The app runs on iPhone and iPad. iPads can be played upright or sideways:
every screen sees the same distance ahead (wider screens get a border at
the sides), so turning an iPad gives no advantage. Turning one mid-run gives
a short "READY?" pause. The app always runs full screen on iPad, not in
Split View. iPads in the app keep the keyboard hint, since many have
keyboards; iPhones hide it.

### App Store screenshots

`store/screenshots/` has ready-made screenshots at the sizes App Store
Connect asks for: the 13-inch iPad, upright (2048 × 2732) and sideways
(2732 × 2048), and the 6.9-inch iPhone (1290 × 2796). Each set shows the
start screen, a jump over a wombat or termite mound, and the dingo ending.
Apple needs iPad screenshots because the app runs on iPad.

### One-time Apple setup

1. **developer.apple.com → Identifiers**: register an App ID with the bundle
   ID `com.emurun.westy` (set in `native/capacitor.config.json` as `appId`).
2. **App Store Connect → Apps**: create the app with that bundle ID. The
   name used in the app is **Emu Run**; if that name is taken on the App
   Store, pick another listing name there and change `appName` in
   `capacitor.config.json` and the display name in `prepare-ios.js` to match.
3. **GitHub → this repo → Settings → Secrets and variables → Actions**: add
   the same four secrets as Bin Chicken (`APPLE_TEAM_ID`, `ASC_KEY_ID`,
   `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`). The existing App Store Connect API
   Team key works for every app on the account. Never paste these into a
   chat.
4. **Actions tab → iOS TestFlight → Run workflow.** A few minutes later the
   build shows up under TestFlight in App Store Connect, after Apple's own
   processing.

Submitting for App Review (screenshots, age rating, privacy answers) is done
by hand in App Store Connect afterwards.

## Android app (Google Play)

The same `native/` wrapper also builds the Android app. Package name:
`com.emurun.westy` (the same ID as the iPhone app). It's built by GitHub
Actions on GitHub's own computers, so nothing needs installing.

- `native/scripts/prepare-android.js` locks phones to portrait and lets
  tablets turn (same rule as iPhone and iPad), sets the version (the build
  number goes up with every run, as Google Play requires), and signs with
  the Play upload key when the build has one.
- `native/resources/icon-foreground.png` and `icon-background.png` are the
  two layers of Android's adaptive icon (the emu, and the sunset behind it),
  so the icon looks right in any shape a phone cuts it to.
- The game reads Android's status bar and gesture bar sizes from the
  `--safe-area-inset-*` values Capacitor provides, so it stays clear of
  them.
- `store/google-play/` has the Play Store listing graphics: the 512 × 512
  icon, the 1024 × 500 feature graphic, and phone (1080 × 1920) and tablet
  (1440 × 2560 and 2560 × 1440) screenshots.

### Try it on an Android phone now

**Actions tab → Android build → Run workflow.** Before the upload key is
set up, this makes a test `.apk` (on the run's page under Artifacts). Unzip
it, copy the `.apk` to an Android phone, open it and allow installing
from that source.

### One-time Google Play setup

1. **Google Play Console** (play.google.com/console): a developer account
   costs US$25 once. Create the app as **Emu Run**, a game, free.
2. **The upload key** (every update must be signed with the same one):
   1. GitHub → this repo → Settings → Secrets and variables → Actions →
      add `ANDROID_KEYSTORE_PASSWORD`: a long password you make up, at
      least 16 characters. Keep it in a password manager.
   2. Actions tab → **Android upload key** → Run workflow. Open
      `upload-key.txt` from the run's Artifacts and paste its whole
      contents into a second secret, `ANDROID_KEYSTORE_BASE64`. Save a copy
      of the file with the password, then delete the run (… menu on the
      run's page). The workflow refuses to make a second key.
   Never paste the password or key into a chat.
3. Actions tab → **Android build** → Run workflow. It now makes
   `…-google-play.aab`. In Play Console, upload it to a testing track
   (Internal testing is quickest), and let Google manage the app signing
   key when it asks (Play App Signing).
4. Fill in the store listing with the graphics in `store/google-play/`, the
   privacy page (`privacy.html` on the website), the content rating
   questionnaire and the data safety form (the game collects no data).

New personal Play developer accounts must run a closed test with at least
12 testers for 14 days before the app can go to production.
