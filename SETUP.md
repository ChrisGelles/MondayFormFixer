# Monday Form Fixer - Setup Instructions

## Quick Start Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Your Monday API Token

1. Log into Monday.com
2. Click your **profile picture** (bottom left corner)
3. Select **Developers**
4. Click **My Access Tokens**
5. Click **Show** next to your personal API token (or create new one with "Generate")
6. **Copy** the token

### 3. Start the Development Server

```bash
npm run dev
```

The app will open in your browser (usually at http://localhost:5173)

### 4. Configure in the App

#### Step 1: Connect to Monday
- Paste your API token
- Click "Connect to Monday"

#### Step 2: Find Your Board IDs

**Source Board** (where your options/data lives):
1. Open the board in Monday.com
2. Look at the URL: `https://yourworkspace.monday.com/boards/1234567890`
3. The number at the end is your Board ID: `1234567890`

**Destination Board** (where new items will be created):
- Same process, just use a different board

#### Step 3: Find Column IDs

**Option A - Use Monday API Explorer:**
1. Go to https://monday.com/developers/v2/try-it-yourself
2. Use your API token
3. Run this query (replace `YOUR_BOARD_ID`):

```graphql
query {
  boards(ids: YOUR_BOARD_ID) {
    columns {
      id
      title
      type
    }
  }
}
```

**Option B - Common Column IDs:**
- First text column: `text`
- Second text column: `text0`
- Third text column: `text1`
- Status column: `status`
- Dropdown: `dropdown`

#### Step 4: Configure Cascade Steps

For each step in your form:
1. Enter a **Label** (what the user sees, e.g., "Department")
2. Enter the **Column ID** (e.g., `text`, `text0`)

Example configuration:
- **Step 1**: Label: "Department", Column ID: `text`
- **Step 2**: Label: "Team", Column ID: `text0`
- **Step 3**: Label: "Role", Column ID: `text1`

### 5. Use the Form

Once configured, the cascading form will appear. Each selection filters the next dropdown until you can submit and create an item!

## Example Board Structure

### Source Board: "Options Database"
| Department | Team      | Role              | Equipment    |
|------------|-----------|-------------------|--------------|
| Engineering| Backend   | Senior Developer  | MacBook Pro  |
| Engineering| Backend   | Junior Developer  | MacBook Air  |
| Engineering| Frontend  | Senior Developer  | MacBook Pro  |
| Marketing  | Content   | Content Writer    | iMac         |

With column IDs:
- Department: `text`
- Team: `text0`
- Role: `text1`
- Equipment: `text2`

### User Flow:
1. Selects "Engineering" → Only shows Backend/Frontend
2. Selects "Backend" → Only shows Senior/Junior Developer
3. Selects "Senior Developer" → Only shows MacBook Pro
4. Clicks "Create Item" → Creates item on destination board

## Troubleshooting

### Can't connect
- Double-check your API token
- Make sure you copied the entire token
- Ensure you have API access in your Monday account

### No options showing
- Verify Board ID is correct (check the URL)
- Make sure Column ID matches your board
- Ensure there's data in that column

### Can't create items
- Check Destination Board ID
- Verify you have write permissions on that board
- Make sure column IDs match the destination board structure

## Need Help?

Check the main README.md for detailed documentation and advanced usage!

