#!/usr/bin/env node
/**
 * Patches node_modules podspecs that are broken when the project path contains
 * spaces (a macOS path like "Personal Projects/lullaby").
 *
 * Patch 1 — React Native prebuilt podspecs (React-Core-prebuilt,
 *   ReactNativeDependencies): resolve_podspec_source() calls URI::File.build()
 *   which raises with "bad component" on paths with spaces.  The rescue clause
 *   returns nil, causing CocoaPods validation to fail with "Missing required
 *   attribute `source`".  We add a fallback to the matching Maven HTTP tarball
 *   URL.  The tarball structure matches what prepare_command expects, so
 *   CocoaPods installs correctly even when resolve_podspec_source() returns nil.
 *
 * Patch 2 — expo-constants EXConstants.podspec: the script_phase uses
 *   `bash -l -c "$PODS_TARGET_SRCROOT/..."` which word-splits at the space in
 *   the expanded path, causing "No such file or directory".  We change to
 *   `bash -l "$PODS_TARGET_SRCROOT/..."` (no -c) so bash receives the script
 *   path as a file argument, where quoting is not needed.
 *
 * Run automatically via the "postinstall" npm script after every npm install.
 */

const fs = require('fs');
const path = require('path');

// Read the RN version so we can build the correct Maven URLs.
const rnPkg = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../node_modules/react-native/package.json'),
    'utf8',
  ),
);
const RN_VERSION = rnPkg.version; // e.g. "0.85.3"
const MAVEN_BASE =
  'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts';

const CORE_URL = `${MAVEN_BASE}/${RN_VERSION}/react-native-artifacts-${RN_VERSION}-reactnative-core-debug.tar.gz`;
const DEPS_URL = `${MAVEN_BASE}/${RN_VERSION}/react-native-artifacts-${RN_VERSION}-reactnative-dependencies-debug.tar.gz`;

const OLD_GIT_FALLBACK = "{ :git => 'https://github.com/facebook/react-native' }";

const patches = [
  {
    file: 'node_modules/react-native/React-Core-prebuilt.podspec',
    original: 's.source                 = source',
    oldPatched: `s.source                 = source || ${OLD_GIT_FALLBACK}`,
    newPatched: `s.source                 = source || { :http => '${CORE_URL}' }`,
  },
  {
    file: 'node_modules/react-native/third-party-podspecs/ReactNativeDependencies.podspec',
    original: 'spec.source               = source',
    oldPatched: `spec.source               = source || ${OLD_GIT_FALLBACK}`,
    newPatched: `spec.source               = source || { :http => '${DEPS_URL}' }`,
  },
  // expo-constants: bash -l -c "..." word-splits when $PODS_TARGET_SRCROOT has spaces.
  // Drop -c so bash receives the script as a file argument (no quoting needed).
  {
    file: 'node_modules/expo-constants/ios/EXConstants.podspec',
    original:
      '    :script => "bash -l -c \\"#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",',
    oldPatched: null,
    newPatched:
      '    :script => "#{env_vars}bash -l \\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",',
  },
];

let anyFailed = false;

patches.forEach(({ file, original, oldPatched, newPatched }) => {
  const filePath = path.resolve(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-rn-podspecs] skipping — file not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(newPatched)) {
    console.log(`[patch-rn-podspecs] already patched: ${file}`);
    return;
  }

  // Migrate from old fallback to the new one (when applicable).
  if (oldPatched && content.includes(oldPatched)) {
    fs.writeFileSync(filePath, content.replace(oldPatched, newPatched), 'utf8');
    console.log(`[patch-rn-podspecs] migrated: ${file}`);
    return;
  }

  // First-time patch.
  if (content.includes(original)) {
    fs.writeFileSync(filePath, content.replace(original, newPatched), 'utf8');
    console.log(`[patch-rn-podspecs] patched: ${file}`);
    return;
  }

  console.warn(
    `[patch-rn-podspecs] pattern not found (package API may have changed): ${file}`,
  );
  anyFailed = true;
});

if (anyFailed) {
  process.exit(1);
}
