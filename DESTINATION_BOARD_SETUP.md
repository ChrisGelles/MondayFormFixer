# Destination Board Setup - Project Athena Orders

## Board Columns Required

Create a Monday board with these exact columns:

| Column Name | Column Type | Monday Column ID | Code Mapping | Notes |
|------------|-------------|------------------|--------------|-------|
| **Name** | Item Name | `name` | `engagementName` | The Event/Engagement Name - displays as "Engagement" |
| **Requester Name** | Text | `text` | `requesterName` | Person making the request |
| **Email** | Text or Email | `text0` | `email` | Validated email address |
| **Department** | Text | `text1` | `department` | Optional field |
| **Date** | Date | `date` | `eventDateTime` | Date & Time widget |
| **Event Duration** | Text | `text2` | `eventDuration` | Free text (e.g., "2 hours") |
| **Requester Description** | Long Text | `text3` | `requesterDescription` | Event description from requester |
| **PA Category** | Text/Dropdown | `text4` | `paCategory` | From cascading filters |
| **Depth** | Text/Dropdown | `text5` | `depth` | From cascading filters |
| **Type** | Text/Dropdown | `text6` | `type` | From cascading filters |
| **Audience** | Text/Dropdown | `text7` | `audience` | From cascading filters |
| **Engagement Name** | Text | `text8` | `selectedEngagement` | From source table |
| **Engagement Description** | Long Text | `long_text` | Engagement description | Auto-filled from source |
| **Status** | Status | `status` | Auto-set | Defaults to "New Request" |

## Step-by-Step Setup in Monday.com

### 1. Create the Board

1. Go to Monday.com
2. Click **+ Add** → **New Board**
3. Name it: **"Project Athena Content Orders"**
4. Choose **Blank Board** template

### 2. Add Columns (in order)

The **Name** column already exists. Add the rest:

#### Column 1: Requester Name
- Click **+ Add Column**
- Select **Text**
- Name it: **"Requester Name"**

#### Column 2: Email
- Click **+ Add Column**
- Select **Email** (or Text if Email not available)
- Name it: **"Email"**

#### Column 3: Department
- Click **+ Add Column**
- Select **Text**
- Name it: **"Department"**

#### Column 4: Date
- Click **+ Add Column**
- Select **Date**
- Name it: **"Date"**
- Enable **Include time of day** in settings

#### Column 5: Event Duration
- Click **+ Add Column**
- Select **Text**
- Name it: **"Event Duration"**

#### Column 6: Requester Description
- Click **+ Add Column**
- Select **Long Text**
- Name it: **"Requester Description"**

#### Column 7: PA Category
- Click **+ Add Column**
- Select **Text** (or **Dropdown** if you want to restrict options)
- Name it: **"PA Category"**

#### Column 8: Depth
- Click **+ Add Column**
- Select **Text** (or **Dropdown**)
- Name it: **"Depth"**

#### Column 9: Type
- Click **+ Add Column**
- Select **Text** (or **Dropdown**)
- Name it: **"Type"**

#### Column 10: Audience
- Click **+ Add Column**
- Select **Text** (or **Dropdown**)
- Name it: **"Audience"**

#### Column 11: Engagement Name
- Click **+ Add Column**
- Select **Text**
- Name it: **"Engagement Name"**

#### Column 12: Engagement Description
- Click **+ Add Column**
- Select **Long Text**
- Name it: **"Engagement Description"**

#### Column 13: Status
- Click **+ Add Column**
- Select **Status**
- Name it: **"Status"**
- Add labels: "New Request", "Approved", "In Progress", "Completed", "Cancelled"

### 3. Get Your Board ID

1. Look at the URL while viewing your board:
   ```
   https://clevelandmuseumofnaturalhistory.monday.com/boards/1234567890
   ```
2. Copy the number: `1234567890`
3. This is your **Destination Board ID**

### 4. Verify Column IDs

Use the Monday API Explorer to confirm your column IDs:

1. Go to: https://monday.com/developers/v2/try-it-yourself
2. Paste your API token
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

4. Verify the column IDs match the table above

### 5. Update Code Mappings (If Needed)

If your column IDs are different, update this section in:  
`/Users/cgelles/Documents/GitHub/MondayFormFixer/src/components/ProjectAthenaForm.tsx`

Around **line 244-260**:

```typescript
const columnValues: Record<string, any> = {
  // User info
  text: requesterName,           // Requester Name column
  text0: email,                  // Email column
  text1: department || '',       // Department column (optional)
  text2: eventDuration,          // Event Duration column
  text3: requesterDescription,   // Requester Description column
  // Content selections
  text4: paCategory,             // PA Category column
  text5: depth,                  // Depth column
  text6: type,                   // Type column
  text7: audience,               // Audience column
  text8: selectedEngagement,     // Engagement Name column
  long_text: engagementDetails?.description || '', // Engagement Description
  // Status
  status: { label: 'New Request' }
};
```

**Replace the column IDs** (text, text0, text1, etc.) with your actual column IDs from the API query.

## Field Mappings Explained

### What the User Fills In:

1. **Event/Engagement Name**: Title of their event (becomes the Monday item name)
2. **Your Name**: Their full name
3. **Email**: Validated email address (must be valid format)
4. **Department**: Optional text field
5. **Event Date & Time**: Date/time picker widget
6. **Event Duration**: Free text (e.g., "2 hours", "full day")
7. **Event Description**: Long text area for details

### What They Select (Cascading):

8. **PA Category** → filters → **Depth** → filters → **Type** → filters → **Audience** → shows → **Engagement Names**

### What Auto-Populates:

9. **Engagement Description**: Pulled from source board based on selected engagement
10. **Status**: Automatically set to "New Request"

## Data Flow

```
User Form Input
    ↓
Event/Engagement Name → Monday Item Name ("Name" column)
Requester Name → text column
Email (validated) → text0 column
Department (optional) → text1 column
Event Date/Time → date column (formatted as YYYY-MM-DD)
Event Duration → text2 column
Requester Description → text3 column
PA Category (selected) → text4 column
Depth (filtered & selected) → text5 column
Type (filtered & selected) → text6 column
Audience (filtered & selected) → text7 column
Engagement Name (filtered & selected) → text8 column
Engagement Description (auto-filled) → long_text column
Status → status column (set to "New Request")
```

## Testing Your Board

After creating the board:

1. Enter the board ID in the app
2. Fill out a test form
3. Submit
4. Check Monday board for new item
5. Verify all fields populated correctly

## Common Issues

### Issue: Columns not populating
**Solution**: Column IDs don't match. Use API explorer to verify IDs and update code.

### Issue: Date not formatting correctly
**Solution**: Date column needs to be type "date" in Monday, not text.

### Issue: Status not setting
**Solution**: Ensure status column exists and has a label "New Request" (exact match).

### Issue: Long text fields truncated
**Solution**: Make sure columns are "Long Text" type, not regular "Text".

## Column Type Reference

| What You Need | Monday Column Type | Value Format |
|---------------|-------------------|--------------|
| Short text | Text | "string value" |
| Long text/description | Long Text | "longer string value" |
| Email | Email or Text | "user@email.com" |
| Date with time | Date (with time enabled) | { date: "2025-10-20" } |
| Dropdown selections | Text or Dropdown | "selected value" |
| Status tracking | Status | { label: "Status Name" } |

## Permissions

Make sure your Monday API token has:
- ✅ Read access to source board (10021032653)
- ✅ Write access to destination board
- ✅ Permission to create items

---

**Once your board is set up**, enter the board ID in the app and you're ready to start collecting Project Athena content orders!

