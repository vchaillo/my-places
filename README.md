# My Places

A lightweight interactive map for saving places to discover or already visited.

## Features
- Leaflet + OpenStreetMap map
- Create, edit and delete places
- Custom categories and status filters
- Address lookup through OpenStreetMap Nominatim (low-volume manual lookup only)
- Browser localStorage persistence (per device)
- Responsive interface

## Development
Open index.html in a browser or serve this directory using a static HTTP server. No build step required.

## Deployment
GitHub Actions deploys the main branch to GitHub Pages. In repository Settings > Pages, select **GitHub Actions** as the source.

## Roadmap
Firebase Authentication (Google), Firestore, shared lists, richer search. This MVP is intentionally vanilla JavaScript and can be migrated to Angular later.

## Firebase setup

1. Create a Firebase web app and paste its public web configuration into `firebase-config.js`.
2. Enable Google in Authentication and authorize `vchaillo.github.io` as an authentication domain.
3. Create Cloud Firestore and merge the My Places rules from `firestore.rules` into your existing project rules and publish them before using account storage.
4. Sign in to save places under `apps/my-places/users/{uid}`. Guest data remains separate in localStorage.
5. Share a place or category collection using the recipient's Firebase UID. The recipient can find their UID in the sharing dialog and receives a read-only snapshot under Collections. Later source edits are not synchronized with a share. The recipient can save a personal copy.

The demo switch adds 50 illustrative Paris-region landmarks with approximate coordinates to the visible layer only. Saving a demo landmark creates a personal copy. Address and named-place search uses the IGN Géoplateforme geocoding service (BAN and BD TOPO); coverage varies for business names. Searches are explicitly submitted, not sent on every keystroke. Dark map tiles are supplied by CARTO with OpenStreetMap attribution.

Firebase integration is prepared but must be verified against the configured project and deployed rules. Never put service account keys in this public repository.

### Access management and user lookup

Publish the updated `firestore.rules` in the Firebase console, preserving rules for other applications in the shared project. After signing in with a verified Google email, My Places registers that email under `apps/my-places/directory/{uid}`. Authenticated users can search this app-specific directory (queries limited to ten results); it contains no saved places or account profile data. Existing users appear after opening the updated app.

Share grants have a stable source ID and a deterministic document ID per sender, source and recipient. Repeated submissions do not create another grant. The share dialog groups legacy duplicate grants by recipient; revoking a row removes every grant in that group. Recipients lose access to the shared selection when its grant is deleted. Copies they previously saved remain their own data.

Map settings and zoom controls belong to Explorer. Site accent preferences are device-local. Place ordering is account-backed and reordering a filtered view preserves the positions of hidden places.

### Multiple collections and received shares

Places accept several collections via checkboxes. Legacy `category` records remain readable; the first membership is retained in `category` for compatibility. Renaming or deleting a collection updates only that membership.

Received places are projected into the map and place list in read-only mode without being saved as personal places. Removing a received item stores a per-account dismissal; it does not delete the sender's data or saved personal copies. Removing an entire share hides all its projected places. Received shares contain the selection captured when it was shared; they do not follow subsequent edits to the owner's original data.

Copying a collection creates a personal collection, a fresh collection ID, the supplied emoji/color, and new place IDs linked to that collection. Name collisions receive a copy suffix. Repeated imports of the same share are prevented. Existing shares without collection metadata use default styling.

Run adapter and data-model checks with `node --test tests/*.test.mjs`. Publish the updated Firestore rules to allow optional collection metadata in new share grants.
