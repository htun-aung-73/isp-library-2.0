# Ebooks — Google Service Account Setup

The `/ebooks` page reads metadata from a **private Google Sheet** using a
**service account** (server-to-server auth, no user OAuth). Follow these steps
once to wire it up.

## What you'll end up with

Five values in your `.env` (already templated in `.env.example`):

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=ebooks-reader@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1AbCdEf...XyZ
GOOGLE_SHEET_RANGE=Ebooks!A2:F
EBOOKS_REVALIDATE_SECONDS=300
```

---

## Step 1 — Create / pick a Google Cloud project

1. Go to <https://console.cloud.google.com/>.
2. Top bar → project dropdown → **New Project** (or select an existing one).
3. Name it (e.g. `isp-library`) and create. Note the project.

## Step 2 — Enable the Google Sheets API

1. Console search bar → "Google Sheets API" → open it.
2. Click **Enable**.
   (Direct link: <https://console.cloud.google.com/apis/library/sheets.googleapis.com>)

> You do NOT need the Drive API — the ebook files are served by Drive's own
> preview/download URLs in the browser, not by this service account.

## Step 3 — Create a service account

1. Console → **APIs & Services → Credentials**
   (<https://console.cloud.google.com/apis/credentials>).
2. **Create credentials → Service account**.
3. Name it (e.g. `ebooks-reader`) → **Create and continue**.
4. Skip the optional "grant access" roles (not needed — access is granted by
   sharing the sheet, not via IAM) → **Done**.

## Step 4 — Create a JSON key

1. On the Credentials page, click the new service account.
2. **Keys** tab → **Add key → Create new key → JSON → Create**.
3. A `*.json` file downloads. **Keep it secret** — it's a credential. Do not
   commit it.

The JSON looks like:

```json
{
  "type": "service_account",
  "project_id": "isp-library",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----\n",
  "client_email": "ebooks-reader@isp-library.iam.gserviceaccount.com",
  ...
}
```

## Step 5 — Fill the env vars from the JSON

- `GOOGLE_SERVICE_ACCOUNT_EMAIL` ← the JSON's `client_email`.
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` ← the JSON's `private_key` value,
  **wrapped in double quotes**, kept on one line with the literal `\n`
  sequences intact. Copy it exactly as it appears inside the JSON string:

  ```env
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----\n"
  ```

  > **Why the `\n` matters:** the app converts the literal `\n` back into real
  > newlines at runtime (`rawKey.replace(/\\n/g, "\n")` in `lib/ebooks/sheet.ts`).
  > If your shell/host strips the quotes or mangles newlines, the JWT will fail
  > with an "invalid key" / "DECODER routines" error. Keep the double quotes.

## Step 6 — Share the Sheet with the service account

This is the step that actually grants read access (no IAM role needed):

1. Open your ebooks Google Sheet.
2. **Share** → paste the service-account email
   (`ebooks-reader@...iam.gserviceaccount.com`).
3. Role: **Viewer** → **Send** (uncheck "notify", it's a robot).

## Step 7 — Set the Sheet ID and range

- `GOOGLE_SHEET_ID` ← from the sheet URL:
  `https://docs.google.com/spreadsheets/d/`**`<THIS_IS_THE_ID>`**`/edit`
- `GOOGLE_SHEET_RANGE` ← `TabName!A2:F`. Default is `Ebooks!A2:F`, which means:
  - the tab must be named **`Ebooks`** (rename it, or change this value),
  - row 1 is the header, data starts at row 2,
  - columns **A–F** in this exact order:

  | A | B | C | D | E | F |
  |---|---|---|---|---|---|
  | Title | Author | Year | Edition | Publisher | Link |

  `Link` is any Google Drive share URL for the ebook file (e.g.
  `https://drive.google.com/file/d/<fileId>/view`). Rows without a usable link
  still list, but show a "No preview" badge.

## Step 8 — `EBOOKS_REVALIDATE_SECONDS`

How often the cached sheet data refreshes. `300` = edits to the sheet appear
within ~5 minutes. Lower for faster updates, higher to hit the Sheets API less.

## Step 9 — Verify

1. Put the values in `.env` (local) — never `.env.example`.
2. `pnpm dev`, log in, open <http://localhost:3000/ebooks>.
3. You should see your sheet rows as cards; clicking one opens the Drive preview.

If the page shows "Ebooks are temporarily unavailable", check the dev server
logs:

| Error | Fix |
|---|---|
| `Missing GOOGLE_SERVICE_ACCOUNT_*` | Env var not loaded — restart `pnpm dev` after editing `.env`. |
| `403` / `PERMISSION_DENIED` | Sheet not shared with the service-account email (Step 6), or Sheets API not enabled (Step 2). |
| `Unable to parse range` | Tab name in `GOOGLE_SHEET_RANGE` doesn't match the actual tab (Step 7). |
| `invalid_grant` / `DECODER routines` | Private key formatting — re-check the quotes and `\n` (Step 5). |

---

## Appendix — gcloud CLI (optional, faster)

If you have the `gcloud` CLI:

```bash
PROJECT=isp-library
gcloud config set project "$PROJECT"
gcloud services enable sheets.googleapis.com
gcloud iam service-accounts create ebooks-reader --display-name="Ebooks reader"
gcloud iam service-accounts keys create key.json \
  --iam-account="ebooks-reader@${PROJECT}.iam.gserviceaccount.com"
# key.json now holds client_email + private_key for Step 5.
# Still do Step 6 (share the sheet) manually in the Sheets UI.
```

Delete `key.json` after copying its values into `.env`.
