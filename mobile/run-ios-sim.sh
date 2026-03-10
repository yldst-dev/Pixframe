#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

DEVICE_NAME="${DEVICE_NAME:-iPhone 17}"
OS_VERSION="${OS_VERSION:-}"
BUNDLE_ID="${BUNDLE_ID:-com.yldst.pixframe}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-${ROOT_DIR}/ios/.derivedData}"

npm run build:native

if [ -z "${OS_VERSION}" ]; then
  OS_VERSION="$(xcrun simctl list devices available | awk -v device="$DEVICE_NAME" '
    /^-- iOS / {
      os=$3
      gsub(/--/, "", os)
      next
    }
    $0 ~ device" \\(" {
      print os
      exit
    }
  ')"
fi

if [ -z "${OS_VERSION}" ]; then
  echo "No available OS found for ${DEVICE_NAME}" >&2
  exit 1
fi

SIM_ID="${SIM_ID:-$(xcrun simctl list devices available | awk -v device="$DEVICE_NAME" -v os="$OS_VERSION" '
  $0 ~ ("-- iOS " os " --") { in_os=1; next }
  $0 ~ /^-- / { in_os=0 }
  in_os && $0 ~ device" \\(" {
    if (match($0, /\(([0-9A-F-]+)\)/)) {
      print substr($0, RSTART + 1, RLENGTH - 2)
      exit
    }
  }
')}"

if [ -z "${SIM_ID}" ]; then
  echo "Simulator not found: ${DEVICE_NAME} (iOS ${OS_VERSION})" >&2
  exit 1
fi

open -a Simulator
xcrun simctl boot "${SIM_ID}" >/dev/null 2>&1 || true
xcrun simctl bootstatus "${SIM_ID}" -b >/dev/null 2>&1 || true

xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -destination "platform=iOS Simulator,id=${SIM_ID}" -derivedDataPath "${DERIVED_DATA_PATH}" build

APP_PATH="${DERIVED_DATA_PATH}/Build/Products/Debug-iphonesimulator/App.app"

if [ -z "${APP_PATH}" ]; then
  echo "App bundle not found in DerivedData" >&2
  exit 1
fi

xcrun simctl install "${SIM_ID}" "${APP_PATH}"
xcrun simctl terminate "${SIM_ID}" "${BUNDLE_ID}" >/dev/null 2>&1 || true
LAUNCH_RESULT="$(xcrun simctl launch "${SIM_ID}" "${BUNDLE_ID}" 2>&1)" || {
  echo "${LAUNCH_RESULT}" >&2
  xcrun simctl listapps "${SIM_ID}" | rg -n "${BUNDLE_ID}" -A 2 -B 2 || true
  exit 1
}
echo "${LAUNCH_RESULT}"
