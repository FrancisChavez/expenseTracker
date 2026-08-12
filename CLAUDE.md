# Expense Tracker V2

Personal expense tracking web application for tracking shared expenses between two users (Franz and Mhai).

## Tech Stack

- **Backend:** Node.js with Express.js v5.1.0
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (dark theme)
- **Storage:** File-based JSON (`expenses.json`)
- **Auth:** Session-based with express-session (7-day expiry)
- **Deployment:** Docker with Alpine Linux, Cloudflare tunnel

## Project Structure

```
├── server.js           # Express backend (API routes, auth, file I/O)
├── public/
│   ├── index.html      # Main expense tracker page (dark theme)
│   ├── script.js       # Main expense tracker logic
│   ├── style.css       # Dark theme styling
│   ├── groceries.html  # Groceries/food budgeting page (light pink theme)
│   ├── groceries.js    # Groceries page logic
│   └── groceries.css   # Light pink theme override
├── expenses.json       # Main expenses data (persisted via Docker volume)
├── expenses.backup.json # Auto-backup on CSV import
├── groceries.json      # Groceries/food data (separate from main expenses)
├── groceries.backup.json # Auto-backup for groceries
├── Dockerfile          # Container image definition
├── compose.yaml        # Docker Compose for Dockge
└── package.json        # Dependencies
```

## Commands

```bash
# Start server locally
npm start

# Docker deployment
docker compose up -d

# Build container
docker compose build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/login | Authenticate user |
| POST | /api/logout | End session |
| GET | /api/me | Check current user |
| GET | /api/expenses | List all expenses |
| POST | /api/expenses | Create expense |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |
| POST | /api/import | Import CSV (creates backup) |
| GET | /api/backup-info | Get backup metadata |
| POST | /api/restore | Restore from backup |
| GET | /api/groceries | List all groceries |
| POST | /api/groceries | Create grocery item |
| PUT | /api/groceries/:id | Update grocery item |
| DELETE | /api/groceries/:id | Delete grocery item |
| POST | /api/groceries/import | Import groceries CSV |
| GET | /api/groceries/backup-info | Get groceries backup info |
| POST | /api/groceries/restore | Restore groceries backup |

## Data Schema

```json
{
  "id": "1766763194165-0",
  "description": "Bus fare",
  "amount": "428",
  "source": "Cash",
  "createdAt": "2025-12-26T12:48:14.103Z",
  "user": "francis",
  "userDisplay": "Franz"
}
```

**Sources:** BDO, BPI, Security Bank, Unionbank, GCASH, PAYMAYA, Credit Cards, Cash, Joint accounts

## Users

Two hardcoded users in `server.js`:
- `francis` (display: Franz)
- `Mhai017` (display: Mhai)

Password: `Skiculot1717!` (same for both)

## Deployment

- **Container port:** 3001
- **Host port:** 3002
- **Network:** cloudflare-net
- **Public URL:** https://gastusinv2.francischavez.info
- **Container user:** nodejs (UID 1001) for security

## Key Features

- Multi-user expense tracking with session auth
- Add/Edit/Delete expenses
- Filter by month, year, and user
- Sort by date or amount
- CSV import/export with auto-backup
- One-click backup restore
- Real-time total calculation (PHP)
- **Groceries/Food Budgeting** - Separate page (`groceries.html`) with light pink theme for tracking food expenses independently
  - Accessible via link below "Expense Tracker" heading
  - Has back button to return to main expense tracker
  - Separate data storage (`groceries.json`) from main expenses
  - Same features: add/edit/delete, filtering, sorting, CSV import/export, backup/restore
  - Shares same login session (no re-authentication needed when switching pages)

## Development Notes

- Credentials are hardcoded in `server.js` (lines 12-17) - consider environment variables for production
- No password hashing - plaintext comparison
- File-based storage has no concurrent write protection
- Login fields are intentionally swapped (password in Textbox1, username in Textbox2)
- Old records without IDs are auto-migrated on first load
- Login container is hidden by default to prevent flash on page load; shown only after session check completes
- New JSON data files need `chmod 666` for container write access (container runs as nodejs UID 1001)

## Docker Health Check

HTTP request to `http://localhost:3001` every 30 seconds with 3 retries.
