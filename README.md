# My Places

A static, Google-authenticated places map using vanilla JavaScript, Leaflet, Firebase Authentication and Cloud Firestore. GitHub Actions publishes `main` to GitHub Pages. No build step is required.

## Setup

1. Configure the public Firebase web application in `firebase-config.js`.
2. Enable Google sign-in and authorize `vchaillo.github.io`.
3. Create Firestore, merge `firestore.rules` with rules for your other applications, and publish them.
4. Open the app and sign in. New accounts are empty. There is no anonymous or demo mode.

Never include a service-account key in this public repository.

## Interface

Places and collections each offer card and compact list layouts, remembered on this device. Personal items and received items occupy separate sections. A searchable multi-select assigns a place to several collections; removing a collection preserves other memberships and the places themselves. Existing single-collection records remain compatible.

The Explorer map uses OpenStreetMap tiles with local appearance controls, or Esri imagery. Its square appearance button is at the top right; map controls are hidden in other tabs. The profile contains Google account information and sign-out. Address suggestions combine IGN and Photon/OpenStreetMap, whose business coverage differs from Google Places.

Selecting a sidebar item centers its map marker. Popups show the address, collection names, status, and a row of icon actions. The directions menu links to Google Maps, Apple Maps, and Waze; the device chooses whether to open the installed application or its website.

## Private data and collaborative sharing

- `apps/my-places/users/{uid}` stores the owner's private state. Only that user can read or write it.
- `apps/my-places/directory/{uid}` contains a verified email and optional Google photo URL. Verified users can search the app-specific directory with queries limited to ten results. Users appear after opening the app.
- `apps/my-places/resources/{resourceId}` stores the common content of a shared collection or place. IDs are deterministic for an owner and source.
- `resources/{resourceId}/members/{recipientUid}` is the authoritative access record. The owner alone creates, changes, or revokes permissions.
- `apps/my-places/shares/{grantId}` lets recipients discover grants in real time. It contains a resource reference and no private account document.

Collection roles are **read** and **edit**. Readers can consult the shared collection or save an independent personal copy. Editors can also change its name, emoji and color, and add, edit, or remove its places. Editors cannot manage access, archive the collection, change its owner/source, or edit unrelated private data. Individual-place shares remain read-only.

Both senders and recipients listen to common resource snapshots. Owner edits in the normal forms update the shared resource; received edit forms use Firestore transactions. Field patches preserve unrelated concurrent edits. Simultaneous changes to the same field use the last committed value. Removing a collection archives its resource; recipients lose resource access. A revoked membership removes access even if a previously opened form still displays an edit action.

Opening the owner's share dialog upgrades matching legacy snapshot shares to a common resource, preserving read-only access and removing duplicate snapshot grants. This requires publishing the new rules first, and the recipient must exist in the app directory. Snapshot shares not yet upgraded remain readable. Existing personal copies are never converted or changed.

Received items may be hidden from the recipient's account through **Retirer**, without deleting the owner's content. Copies have new collection/place IDs, preserve supplied collection styling, and do not synchronize. Notification counts next to Places and Collections mark unseen grants; viewing the corresponding content records them as seen. Snapshot listeners deliver new shares without a page reload.

## Verification

Serve the repository with any static HTTP server. Run:

```sh
node --test tests/*.test.mjs
```

Tests cover memberships, independent copies, navigation URLs, concurrent field merges, private-state preservation, and adapter snapshots across two simulated accounts, including changes of role, revocation, idempotency, and legacy migration. Adapter tests use an in-memory Firebase SDK double. They do not execute the deployed Firestore rules.

Before relying on production collaboration, validate the published rules with the Firestore Emulator and check read-only, edit, downgrade, revoke, and cross-owner denial using real accounts. The current execution environment does not provide a Firestore emulator or signed-in Google test accounts.
