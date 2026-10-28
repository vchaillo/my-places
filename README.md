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
3. Create Cloud Firestore and publish `firestore.rules` before using account storage.
4. Sign in to save places under `users/{uid}`. Guest data remains separate in localStorage.
5. Share a place or category collection using the recipient's Firebase UID. The recipient can find their UID in the sharing dialog and receives a read-only snapshot under Collections. Later source edits are not synchronized with a share. The recipient can save a personal copy.

The demo switch adds 50 illustrative Paris-region landmarks with approximate coordinates to the visible layer only. Saving a demo landmark creates a personal copy. Address and named-place search uses the IGN Géoplateforme geocoding service (BAN and BD TOPO); coverage varies for business names. Searches are explicitly submitted, not sent on every keystroke. Dark map tiles are supplied by CARTO with OpenStreetMap attribution.

Firebase integration is prepared but must be verified against the configured project and deployed rules. Never put service account keys in this public repository.
