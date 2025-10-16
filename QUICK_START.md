# Quick Start Guide - Project Athena Form

Get the form up and running in 5 minutes!

## Prerequisites
- Node.js installed
- Monday.com account with API access
- Access to board ID `10021032653` (source board)

## 1. Install Dependencies (1 minute)

```bash
cd /Users/cgelles/Documents/GitHub/MondayFormFixer
npm install
```

## 2. Get Your Monday API Token (2 minutes)

1. Go to Monday.com
2. Click your profile picture (bottom left)
3. Select **Developers**
4. Click **My Access Tokens**
5. Copy your token (or create one)

## 3. Create Destination Board (5 minutes)

### Create the Board
1. In Monday.com, click **+ Add** → **New Board**
2. Name it **"Project Athena Orders"**
3. Choose any template (we'll customize it)

### Add Required Columns

Click **+ Add Column** and create these:

| Column Name | Type | Notes |
|------------|------|-------|
| Name | Text | User's name |
| Email | Text | Their email |
| Department | Text | Their department |
| Event Date | Date | When event starts |
| Event Duration | Text | Length of event |
| Engagement Duration | Text | Length of engagement |
| User Notes | Long Text | Additional details |
| PA Category | Text | Selected category |
| Depth | Text | Selected depth |
| Type | Text | Selected type |
| Audience | Text | Selected audience |
| Engagement Name | Text | Selected engagement |
| Content Description | Long Text | Auto-filled |
| Status | Status | Default statuses are fine |

### Get the Board ID
Copy the number from the URL:
```
https://clevelandmuseumofnaturalhistory.monday.com/boards/XXXXXXXXXX
                                                               ^^^^^^^^^^
```

## 4. Find Your Source Board Column IDs (2 minutes)

1. Go to https://monday.com/developers/v2/try-it-yourself
2. Paste your API token
3. Run this query:

```graphql
query {
  boards(ids: 10021032653) {
    name
    columns {
      id
      title
      type
    }
  }
}
```

4. Note down the column IDs for:
   - PA Category
   - Depth
   - Type
   - Audience  
   - Description (usually `long_text`)

## 5. Update Column Mappings (3 minutes)

Open: `/Users/cgelles/Documents/GitHub/MondayFormFixer/src/components/ProjectAthenaForm.tsx`

### Line 52 - Source Board Columns:
```typescript
const COLUMN_IDS = {
  paCategory: 'YOUR_ID_HERE',  // Replace with actual column ID
  depth: 'YOUR_ID_HERE',       // Replace with actual column ID
  type: 'YOUR_ID_HERE',        // Replace with actual column ID
  audience: 'YOUR_ID_HERE',    // Replace with actual column ID
  engagementName: 'name',      // Keep as 'name'
  description: 'YOUR_ID_HERE'  // Usually 'long_text'
};
```

### Line 165 - Destination Board Columns:

Run the same query for your destination board:
```graphql
query {
  boards(ids: YOUR_DESTINATION_BOARD_ID) {
    columns {
      id
      title
      type
    }
  }
}
```

Then update the mappings:
```typescript
const columnValues: Record<string, any> = {
  text: name,              // Update 'text' to your Name column ID
  text0: email,            // Update to your Email column ID
  text1: department,       // Update to your Department column ID
  text2: userDescription,  // Update to your User Notes column ID
  text3: eventDuration,    // Update to your Event Duration column ID
  text4: engagementDuration, // Update to your Engagement Duration column ID
  text5: paCategory,       // Update to your PA Category column ID
  text6: depth,            // Update to your Depth column ID
  text7: type,             // Update to your Type column ID
  text8: audience,         // Update to your Audience column ID
  text9: selectedEngagement, // Update to your Engagement Name column ID
  long_text: engagementDetails?.description || '', // Update to your Content Description column ID
  status: { label: 'New Request' } // Update if your status column has different label
};
```

## 6. Start the App (30 seconds)

```bash
npm run dev
```

The app will open in your browser!

## 7. Connect and Configure (1 minute)

1. **Paste your API token** → Click "Connect"
2. **Enter your destination board ID**
3. The form will appear below!

## 8. Test It! (2 minutes)

1. Fill in your info
2. Select filters (Category → Depth → Type → Audience)
3. Choose an engagement
4. Click **Submit Request**
5. Check your Monday board - new item should appear!

## Troubleshooting

### Can't connect?
- Double-check API token
- Make sure you have API access in Monday

### No options in dropdowns?
- Verify source board ID: `10021032653`
- Check column IDs match your board
- Make sure source board has data

### Can't create items?
- Verify destination board ID
- Check all column ID mappings
- Look in browser console (F12) for errors

## Debug Tools

Once the app is running, open browser console (F12) and try:

```javascript
// Test connection
await mondayDebug.testConnection()

// See source board structure
await mondayDebug.getBoardColumns('10021032653')

// Test cascade logic
await mondayDebug.testCascadingFilters('10021032653')

// Full diagnostic
await mondayDebug.runDiagnostics('10021032653', 'YOUR_DEST_BOARD_ID')
```

## Next Steps

- See `PROJECT_ATHENA_SETUP.md` for detailed configuration
- See `COLUMN_ID_REFERENCE.md` for column mapping help
- See `README.md` for full documentation

## Still Stuck?

Common issues:
1. **Wrong column IDs** - Use API explorer to double-check
2. **Column type mismatch** - Status/Date columns need special formats
3. **Permissions** - Make sure API token has write access

---

**You're ready!** Start collecting Project Athena content orders from your museum staff! 🎉

