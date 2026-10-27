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
