# StudySense Time Guard

The installable Chrome/Edge Manifest V3 extension used by StudySense's Time Guard feature.

## Recommended install

1. Download the latest packaged ZIP from https://github.com/tandomroblox/StudySense/releases/latest/download/StudySense-Time-Guard.zip.
2. Extract the ZIP. The extracted folder should contain manifest.json at its top level.
3. Open chrome://extensions/ (Chrome) or edge://extensions/ (Microsoft Edge).
4. Turn on Developer mode, select Load unpacked, and choose the extracted folder.
5. Open the extension from the browser toolbar and save your preferred tracking settings.

The public install guide is https://studysense.studysenseapp.workers.dev/time-guard.html.

## Package

The .github/workflows/release-time-guard.yml workflow packages only the runtime extension files into StudySense-Time-Guard.zip whenever files in this directory change on main. Releases are built from the version in manifest.json; bump that version whenever extension behavior or permissions change.

## Permissions and privacy

Website host permissions are optional. Restricted-site mode requests access only to listed domains. All-website hostname reporting requires broader host permissions. Usage totals remain in the browser profile and are not sent to the StudySense website or account. See the repository README for details and limitations.
