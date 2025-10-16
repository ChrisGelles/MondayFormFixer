# Monday Column ID Quick Reference

This document helps you find and map column IDs for your Monday boards.

## How to Find Column IDs

### Method 1: Monday API Explorer (Recommended)

1. Go to https://monday.com/developers/v2/try-it-yourself
2. Enter your API token when prompted
3. Run this query (replace `YOUR_BOARD_ID`):

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

4. You'll get back all columns with their IDs

**Example response:**
```json
{
  "data": {
    "boards": [{
      "name": "Your Board Name",
      "columns": [
        { "id": "text", "title": "Name", "type": "text" },
        { "id": "text0", "title": "Email", "type": "text" },
        { "id": "status", "title": "Status", "type": "color" },
        { "id": "date", "title": "Date", "type": "date" },
        { "id": "long_text", "title": "Description", "type": "long-text" }
      ]
    }]
  }
}
```

### Method 2: Browser Console

1. Open your Monday board in browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Type: `monday.get('context')` and press Enter
5. Look through the response for column information

### Method 3: Common Patterns

Monday typically uses these patterns:

| Column Type | First | Second | Third | Fourth | Fifth |
|------------|-------|--------|-------|--------|-------|
| Text | `text` | `text0` | `text1` | `text2` | `text3` |
| Numbers | `numbers` | `numbers0` | `numbers1` | `numbers2` | `numbers3` |
| Date | `date` | `date4` | `date5` | `date6` | `date7` |
| Status | `status` | `status4` | `status5` | `status6` | `status7` |
| Dropdown | `dropdown` | `dropdown0` | `dropdown1` | `dropdown2` | `dropdown3` |
| Long Text | `long_text` | `long_text0` | `long_text1` | `long_text2` | `long_text3` |
| People | `person` | `person0` | `person1` | `person2` | `person3` |
| Email | `email` | `email0` | `email1` | `email2` | `email3` |
| Phone | `phone` | `phone0` | `phone1` | `phone2` | `phone3` |

**Note:** The exact IDs depend on the order columns were created. Always verify with Method 1!

## For Source Board (10021032653)

You need to identify these columns in your source board:

1. **PA Category** - Find the column ID
2. **Depth** - Find the column ID  
3. **Type** - Find the column ID
4. **Audience** - Find the column ID
5. **Description** - Usually `long_text` or similar

Run this query to get them:
```graphql
query {
  boards(ids: 10021032653) {
    columns {
      id
      title
      type
    }
  }
}
```

Then update in `ProjectAthenaForm.tsx` around line 52:
```typescript
const COLUMN_IDS = {
  paCategory: 'YOUR_COLUMN_ID_HERE',
  depth: 'YOUR_COLUMN_ID_HERE',
  type: 'YOUR_COLUMN_ID_HERE',
  audience: 'YOUR_COLUMN_ID_HERE',
  engagementName: 'name',  // Item name - always 'name'
  description: 'YOUR_LONG_TEXT_COLUMN_ID_HERE'
};
```

## For Destination Board

Map these fields to your destination board columns:

| Field | What It Is | Update Line ~165 in ProjectAthenaForm.tsx |
|-------|------------|-------------------------------------------|
| Name | User's name | `text: name` |
| Email | User's email | `text0: email` |
| Department | User's dept | `text1: department` |
| User Notes | Additional info | `text2: userDescription` |
| Event Duration | How long event is | `text3: eventDuration` |
| Engagement Duration | Content length | `text4: engagementDuration` |
| PA Category | Selected category | `text5: paCategory` |
| Depth | Selected depth | `text6: depth` |
| Type | Selected type | `text7: type` |
| Audience | Selected audience | `text8: audience` |
| Engagement Name | Chosen engagement | `text9: selectedEngagement` |
| Content Desc | Auto-filled | `long_text: engagementDetails?.description` |
| Status | Request status | `status: { label: 'New Request' }` |

## Value Formats by Column Type

Different column types need different formats when creating items:

### Text Columns
```typescript
text: "Simple string"
text0: "Another string"
```

### Number Columns
```typescript
numbers: 42
numbers0: 100.5
```

### Status Columns
```typescript
status: { label: "Working on it" }
status4: { label: "Done" }
```

### Date Columns
```typescript
// Just date
date: { date: "2025-10-20" }

// Date with time
date: { date: "2025-10-20", time: "14:30:00" }
```

### Dropdown Columns
```typescript
dropdown: { labels: ["Option 1"] }
dropdown0: { labels: ["Multiple", "Options"] }
```

### People Columns
```typescript
person: { 
  personsAndTeams: [
    { id: 12345, kind: "person" }
  ]
}
```

### Long Text Columns
```typescript
long_text: "This can be a very long text with multiple paragraphs..."
long_text0: "Another long text field"
```

### Email Columns
```typescript
email: { email: "user@example.com", text: "Display Name" }
```

### Phone Columns
```typescript
phone: { phone: "+1-555-123-4567", countryShortName: "US" }
```

### Link Columns
```typescript
link: { url: "https://example.com", text: "Display Text" }
```

## Testing Your Mapping

1. Start with just one or two columns
2. Create a test item manually in Monday to see the format
3. Use the API to query an existing item:

```graphql
query {
  items(ids: YOUR_ITEM_ID) {
    column_values {
      id
      text
      value
      type
    }
  }
}
```

4. The `value` field shows the JSON format Monday uses
5. Update your code to match that format

## Common Issues

### Issue: Column values not saving
**Solution:** Check the format matches the column type exactly

### Issue: Getting "invalid value" errors
**Solution:** Some columns (like Status) require exact label matches

### Issue: Dropdown not accepting values
**Solution:** The label must exactly match an existing dropdown option

### Issue: Date not formatting correctly  
**Solution:** Use ISO format: `YYYY-MM-DD` for dates

### Issue: People column not working
**Solution:** You need the person's user ID, not their name

## Getting People IDs

To find user IDs for People columns:

```graphql
query {
  users {
    id
    name
    email
  }
}
```

Then use the ID in your column value:
```typescript
person: { 
  personsAndTeams: [{ id: 12345678, kind: "person" }]
}
```

---

**Pro Tip:** Always test with a single item creation first before deploying to production!

