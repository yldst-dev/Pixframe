import semver from 'semver';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { version as currentVersion } from '../package.json';

async function updateLatestVersion(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { version: publishedVersion, url } = await fetch('https://exif-frame.yldst.cam/version.json').then((res) => res.json());

    if (semver.gt(publishedVersion, currentVersion)) {
      const bundle = await CapacitorUpdater.download({ url, version: publishedVersion });
      await CapacitorUpdater.set(bundle);
    } else {
      await SplashScreen.hide();
    }
  } catch {
    await SplashScreen.hide();
  }

  CapacitorUpdater.notifyAppReady();
}

updateLatestVersion();
