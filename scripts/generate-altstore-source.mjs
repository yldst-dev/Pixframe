import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

const [repo, tag, version, buildVersion, ipaPath, outputPath] = process.argv.slice(2);

if (!repo || !tag || !version || !buildVersion || !ipaPath || !outputPath) {
  throw new Error('Usage: node scripts/generate-altstore-source.mjs <repo> <tag> <version> <buildVersion> <ipaPath> <outputPath>');
}

const privacy = {
  NSPhotoLibraryUsageDescription: 'Pixframe needs photo library access to read albums and save exported images.',
  NSPhotoLibraryAddUsageDescription: 'Pixframe needs add-only access to save exported images to your photo library.',
};

const iconURL = `https://github.com/${repo}/releases/latest/download/Pixframe-icon.png`;
const source = {
  name: 'Pixframe',
  subtitle: 'Official Pixframe releases for AltStore Classic.',
  description: 'Pixframe release channel for AltStore Classic.',
  iconURL,
  headerURL: iconURL,
  website: `https://github.com/${repo}`,
  tintColor: '#111111',
  featuredApps: ['com.yldst.pixframe'],
  apps: [
    {
      name: 'Pixframe',
      bundleIdentifier: 'com.yldst.pixframe',
      developerName: 'YLDST',
      subtitle: 'Photo export utility for metadata layouts and watermarks.',
      localizedDescription: 'Pixframe helps you render EXIF-style overlays, manage watermark themes, and export polished photo layouts directly from mobile.',
      iconURL,
      tintColor: '#111111',
      category: 'utilities',
      versions: [
        {
          version,
          buildVersion,
          date: new Date().toISOString().slice(0, 10),
          localizedDescription: `Pixframe ${version} for AltStore Classic.`,
          downloadURL: `https://github.com/${repo}/releases/download/${tag}/Pixframe-altstore.ipa`,
          size: statSync(ipaPath).size,
          sha256: createHash('sha256').update(readFileSync(ipaPath)).digest('hex'),
          minOSVersion: '15.0',
        },
      ],
      appPermissions: {
        entitlements: [],
        privacy,
      },
    },
  ],
  news: [],
};

writeFileSync(outputPath, `${JSON.stringify(source, null, 2)}\n`);
