# Testing Guide - Project Athena Form

## The App is Now Running!

Your browser should have opened to: **http://localhost:5173**

If not, manually open: http://localhost:5173

## What You'll See

### Step 1: Login Screen

You'll see a purple gradient background with a white panel asking for your **Monday API Token**.

**To get your token:**
1. Open a new tab → Go to https://monday.com
2. Click your **profile picture** (bottom left)
3. Select **"Developers"**
4. Click **"My Access Tokens"**
5. Either:
   - Click **"Show"** on your personal token, OR
   - Click **"Generate"** to create a new one
6. **Copy** the entire token
7. **Paste** it into the app
8. Click **"Connect to Monday"**

### Step 2: Configuration Screen

After connecting, you'll see:
- **Source Board ID** (already filled in: `10021032653`)
- **Destination Board ID** (empty - you need to fill this)

**For testing without creating a real board yet:**

You can use the source board ID for both (just to test the connection):
- Enter `10021032653` in the Destination Board ID field

⚠️ **Note**: This will try to create items in your source board, which might not be ideal. Better to create a test board first!

### Step 3: Create a Test Destination Board (Recommended)

**Quick test board setup:**
1. Go to Monday.com
2. Click **+ Add** → **New Board**
3. Name it **"PA Orders TEST"**
4. Choose any template (we'll ignore the columns)
5. Copy the board ID from URL: `https://monday.com/boards/XXXXXXXXXX`
6. Paste it into the "Destination Board ID" field in the app

### Step 4: The Form Appears!

Once both board IDs are entered, the **Project Athena Content Request** form will appear below.

## Testing the Form

### Test 1: Check the Dropdowns Load

1. Look at the **PA Category** dropdown
2. Click it - do you see options?
   - ✅ **If YES**: Your source board connection works!
   - ❌ **If NO**: Column ID might be wrong

### Test 2: Test the Cascade Logic

1. Select a **PA Category**
2. Watch the **Depth** dropdown
   - Does it populate with options?
   - Are they filtered based on your category selection?
3. Select a **Depth**
4. Watch the **Type** dropdown populate
5. Select a **Type**  
6. Watch the **Audience** dropdown populate
7. Select an **Audience**
8. Watch the **Engagement Name** dropdown populate

### Test 3: Fill Out the Form

1. **Your Information:**
   - Name: "Test User"
   - Email: "test@museum.org"
   - Department: "Testing"
   - Event Start Date/Time: Pick any date/time
   - Event Duration: "2 hours"
   - Engagement Duration: "30 minutes"
   - Additional Notes: "This is a test"

2. **Select Content:**
   - Go through all the dropdowns as in Test 2
   - Select an Engagement Name
   - You should see the engagement description appear below

3. **Submit:**
   - Click **"Submit Request"**
   - Watch for success or error message

## Using Debug Tools

Open your browser's **Developer Console**:
- Mac: `Cmd + Option + I`
- Windows: `F12`

Then click the **Console** tab and try these commands:

### Test 1: Verify Connection
```javascript
await mondayDebug.testConnection()
```
Should show: `✅ Connection successful` with your user info

### Test 2: See Source Board Structure
```javascript
await mondayDebug.getBoardColumns('10021032653')
```
Shows all columns with their IDs in a table

### Test 3: See Sample Data
```javascript
await mondayDebug.getSampleItems('10021032653', 3)
```
Shows 3 sample items from the source board

### Test 4: Test Cascade Logic
```javascript
await mondayDebug.testCascadingFilters('10021032653')
```
Tests the cascading dropdown logic and shows which column IDs to use

### Test 5: Full Diagnostics
```javascript
await mondayDebug.runDiagnostics('10021032653', 'YOUR_DEST_BOARD_ID')
```
Runs all tests and shows complete board structure

## Troubleshooting

### Problem: "Failed to connect to Monday.com"
**Solution:**
- Verify you copied the entire API token
- Check you have API access in Monday
- Try generating a new token

### Problem: No options in PA Category dropdown
**Solutions:**
1. Check browser console for errors
2. Run: `await mondayDebug.getBoardColumns('10021032653')`
3. Look for the column containing PA Category
4. Update line 52 in `ProjectAthenaForm.tsx` with correct column ID

### Problem: Dropdowns don't cascade (all show same options)
**Solution:**
- Column IDs are likely wrong
- Run: `await mondayDebug.testCascadingFilters('10021032653')`
- Update column IDs in code based on results

### Problem: "Error creating item"
**Solutions:**
1. Destination board ID is wrong
2. Column ID mappings don't match destination board
3. Column types don't match (e.g., trying to put text in a status column)
4. Run: `await mondayDebug.getBoardColumns('YOUR_DEST_BOARD_ID')`
5. Update line 165 in `ProjectAthenaForm.tsx` with correct mappings

### Problem: Form submits but no item appears
**Solutions:**
- Check Monday board - might take a few seconds to appear
- Refresh the Monday board
- Check browser console for API errors
- Verify you have write permissions on destination board

## Quick Column ID Fix

If dropdowns aren't working, here's how to fix it fast:

1. **Open Console** (F12)
2. **Run this:**
```javascript
await mondayDebug.getBoardColumns('10021032653')
```

3. **Look at the table** - find these columns:
   - PA Category column → note its ID
   - Depth column → note its ID
   - Type column → note its ID
   - Audience column → note its ID
   - Description column → note its ID

4. **Open the file:**
   `/Users/cgelles/Documents/GitHub/MondayFormFixer/src/components/ProjectAthenaForm.tsx`

5. **Find line 52** and update:
```typescript
const COLUMN_IDS = {
  paCategory: 'PUT_PA_CATEGORY_ID_HERE',
  depth: 'PUT_DEPTH_ID_HERE',
  type: 'PUT_TYPE_ID_HERE',
  audience: 'PUT_AUDIENCE_ID_HERE',
  engagementName: 'name',  // Always 'name'
  description: 'PUT_DESCRIPTION_ID_HERE'
};
```

6. **Save the file** - the app will auto-reload!

## Expected Behavior

### ✅ Working Correctly:
- PA Category dropdown shows options immediately
- Each dropdown filters based on previous selection
- Engagement Name shows only items matching all filters
- Description appears when engagement is selected
- Submit button enables only when all required fields filled
- Success message appears after submission
- New item appears in Monday board
- Form clears after successful submission

### ❌ Needs Fixing:
- Empty dropdowns
- All dropdowns show same options
- Can't select multiple filters in sequence
- Engagement description doesn't appear
- Submit fails with error
- No item created in Monday

## Testing Checklist

Use this to verify everything works:

- [ ] App loads at localhost:5173
- [ ] Can paste API token
- [ ] Connection successful
- [ ] Can see both board ID fields
- [ ] Form appears when board IDs entered
- [ ] PA Category dropdown has options
- [ ] Selecting category filters Depth options
- [ ] Selecting depth filters Type options
- [ ] Selecting type filters Audience options
- [ ] Selecting audience shows Engagements
- [ ] Can select an engagement
- [ ] Engagement description displays
- [ ] All user info fields accept input
- [ ] Submit button enables when complete
- [ ] Clicking submit shows loading state
- [ ] Success message appears
- [ ] New item created in Monday board
- [ ] Form clears after success

## Next Steps After Testing

Once basic testing works:

1. **Create proper destination board** with all required columns
2. **Map column IDs** correctly for destination board
3. **Test real submission** with actual event data
4. **Share with colleagues** for user testing
5. **Deploy to production** when ready

## Need Help?

1. Check browser console for errors
2. Use `mondayDebug` tools to diagnose
3. Review COLUMN_ID_REFERENCE.md
4. Check Monday API explorer for column details

---

**The app is running!** Open http://localhost:5173 and start testing! 🚀

