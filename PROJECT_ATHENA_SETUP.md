# Project Athena Order Form - Complete Setup Guide

This guide will walk you through setting up the Project Athena content ordering system.

## Overview

**What this does:**
- Museum staff fill out a form with their event details
- They select filters (PA Category → Depth → Type → Audience)
- System shows available engagements that match their criteria
- They select an engagement and submit
- A new order appears in your Monday board

## Step-by-Step Setup

### 1. Create Your Destination Board in Monday

1. Go to Monday.com and create a new board
2. Name it **"Project Athena Content Orders"** (or whatever you prefer)
3. Add the following columns:

#### Required Columns:

| Column Name | Column Type | Purpose |
|------------|-------------|---------|
| Item Name | Name | Auto-generated from submission |
| Name | Text | Requester's name |
| Email | Text or Email | Requester's email |
| Department | Text | Their department |
| Event Start | Date | When the event starts |
| Event Duration | Text | How long the event is |
| Engagement Duration | Text | How long the content engagement is |
| User Notes | Long Text | Additional details from requester |
| PA Category | Text | Selected category |
| Depth | Text | Selected depth |
| Type | Text | Selected type |
| Audience | Text | Selected audience |
| Engagement Name | Text | Selected engagement |
| Content Description | Long Text | Auto-filled from source |
| Status | Status | Request status (New/Approved/Scheduled/Completed) |
| Submitted Date | Date | Auto-filled submission date |

4. **Copy the Board ID** from the URL:
   ```
   https://clevelandmuseumofnaturalhistory.monday.com/boards/XXXXXXXXXX
                                                               ^^^^^^^^^^
   ```

### 2. Find Your Column IDs

You need to know the column IDs for your destination board. Here's how:

#### Option A: Use Monday API Explorer

1. Go to https://monday.com/developers/v2/try-it-yourself
2. Enter your API token
3. Run this query (replace `YOUR_BOARD_ID` with your destination board ID):

```graphql
query {
  boards(ids: YOUR_BOARD_ID) {
    name
    columns {
      id
      title
      type
    }
  }
}
```

4. You'll get a response like:
```json
{
  "data": {
    "boards": [{
      "name": "Project Athena Content Orders",
      "columns": [
        { "id": "text", "title": "Name", "type": "text" },
        { "id": "text0", "title": "Email", "type": "text" },
        { "id": "text1", "title": "Department", "type": "text" },
        ...
      ]
    }]
  }
}
```

#### Option B: Common Column IDs

Monday usually assigns these IDs:
- First text column: `text`
- Second text column: `text0`
- Third text column: `text1`
- Fourth text column: `text2`
- And so on...
- First date column: `date`
- Second date column: `date4`
- First long text: `long_text`
- Status column: `status`

### 3. Update Column Mapping in Code

Once you know your column IDs, update the file:  
`/Users/cgelles/Documents/GitHub/MondayFormFixer/src/components/ProjectAthenaForm.tsx`

Around line 52, you'll find:
```typescript
const COLUMN_IDS = {
  paCategory: 'text',      // Adjust these based on your actual column IDs
  depth: 'text0',
  type: 'text1',
  audience: 'text2',
  engagementName: 'name',  // Item name
  description: 'long_text' // Long text column
};
```

And around line 165:
```typescript
const columnValues: Record<string, any> = {
  // User info
  text: name,              // Name column
  text0: email,            // Email column
  text1: department,       // Department column
  text2: userDescription,  // User notes column
  text3: eventDuration,    // Event duration column
  text4: engagementDuration, // Engagement duration column
  // Content selections
  text5: paCategory,       // PA Category column
  text6: depth,            // Depth column
  text7: type,             // Type column
  text8: audience,         // Audience column
  text9: selectedEngagement, // Engagement name column
  long_text: engagementDetails?.description || '', // Content description
  // Status
  status: { label: 'New Request' }
};
```

**Update these to match your actual column IDs!**

### 4. Verify Your Source Board Structure

Your source board (ID: `10021032653`) should have:
- **Item Name**: The engagement name
- **PA Category**: Column for categories
- **Depth**: Column for depth levels
- **Type**: Column for types
- **Audience**: Column for audience types
- **Description**: Long text with engagement details

You'll also need to update the `COLUMN_IDS` at the top of `ProjectAthenaForm.tsx` to match these.

### 5. Start the Application

```bash
cd /Users/cgelles/Documents/GitHub/MondayFormFixer
npm run dev
```

### 6. Connect and Configure

1. **Get your API token**:
   - Log into Monday.com
   - Click your profile picture (bottom left)
   - Developers → My Access Tokens
   - Copy your token

2. **In the app**:
   - Paste your API token
   - Click "Connect to Monday"
   - Enter your destination board ID
   - The form will appear!

## Using the Form

### For Staff Members:

1. **Fill in your information**:
   - Name, Email, Department
   - Event date/time
   - Event duration (e.g., "3 hours", "Full day")
   - Engagement duration (e.g., "30 minutes", "1 hour")
   - Any additional notes

2. **Select content filters**:
   - Choose PA Category → Only relevant Depths appear
   - Choose Depth → Only relevant Types appear
   - Choose Type → Only relevant Audiences appear
   - Choose Audience → Shows matching Engagements

3. **Review engagement**:
   - Select an engagement from the filtered list
   - Read the description that appears

4. **Submit**:
   - Click "Submit Request"
   - A new order is created in your Monday board!

## Troubleshooting

### "No engagements match your criteria"
- Check that your source board has data with those exact filter values
- Verify all filter columns have data
- Try different filter combinations

### Items creating with wrong data
- Double-check your column ID mappings in `ProjectAthenaForm.tsx`
- Use the Monday API explorer to verify column IDs
- Make sure column types match (text vs dropdown vs status)

### Can't load source board
- Verify board ID `10021032653` is correct
- Check you have read permissions on that board
- Ensure your API token is valid

### Column values not saving
- Status columns need format: `{ label: 'Status Name' }`
- Date columns need format: `{ date: 'YYYY-MM-DD' }`
- Text/number columns: just use the string/number value
- Dropdown columns: use the exact label text

## Column Value Formats

Different column types require different formats when creating items:

```typescript
// Text columns
text: "Simple string value"

// Number columns  
numbers: 42

// Status columns
status: { label: "Working on it" }

// Date columns
date: { date: "2025-10-20" }

// People columns
person: { personsAndTeams: [{ id: 12345, kind: "person" }] }

// Dropdown columns
dropdown: { labels: ["Option 1"] }

// Long text columns
long_text: "Longer text content..."
```

## Customization

### Change Form Fields

Edit `ProjectAthenaForm.tsx`:
- Add/remove input fields in the "User Information" section
- Add validation as needed
- Customize styling in `ProjectAthenaForm.css`

### Change Filter Flow

Currently: PA Category → Depth → Type → Audience

To modify:
1. Update the cascading `useEffect` hooks in `ProjectAthenaForm.tsx`
2. Add/remove filter dropdowns in the "Select Content" section
3. Update the `COLUMN_IDS` mapping

### Add Notifications

You could integrate:
- Email notifications when orders are submitted
- Slack notifications
- SMS via Twilio
- Monday notifications/automations

## Deployment

When ready to deploy for production use:

```bash
npm run build
```

Then deploy the `dist` folder to:
- **Vercel**: Connect your GitHub repo
- **Netlify**: Drag and drop the `dist` folder
- **Your server**: Any static file hosting

## Security Notes

- API tokens are stored in browser localStorage only
- Never commit your `.env` file or API tokens to git
- Consider using Monday's OAuth for multi-user deployments
- Add rate limiting if deploying publicly

## Support

For issues:
- Check the main README.md for general troubleshooting
- Visit Monday Developer Community: https://community.monday.com/c/developers
- Check Monday API docs: https://developer.monday.com/api-reference

---

**Ready to go!** Start the app and begin collecting Project Athena content orders from your museum staff.

