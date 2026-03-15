# Product Readiness Checklist

## Core pages
- [ ] Login
- [ ] Dashboard
- [ ] Command Center
- [ ] Energy
- [ ] LifeMesh
- [ ] EarthShield
- [ ] Alerts
- [ ] Sites
- [ ] Users
- [ ] Settings

## For each page verify
- [ ] Page loads without runtime errors
- [ ] Seeded/demo data appears correctly
- [ ] Empty state does not break layout
- [ ] Refresh works on protected route
- [ ] Buttons do not crash the page
- [ ] Build still passes after changes

## Backend/API
- [ ] Auth endpoints verified
- [ ] Dashboard stats endpoint verified
- [ ] Alerts endpoint verified
- [ ] Energy endpoint verified
- [ ] LifeMesh endpoint verified
- [ ] EarthShield endpoint verified
- [ ] Sites endpoint verified
- [ ] Users endpoint verified

## Release hardening
- [ ] .env kept out of git
- [ ] cookies kept out of git
- [ ] build artifacts ignored
- [ ] README present
- [ ] rollback point exists
