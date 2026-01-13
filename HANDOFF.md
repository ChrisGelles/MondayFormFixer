# Handoff Instructions - CMNH Engagement Form

## Project Overview
React/TypeScript application that creates cascading forms using Monday.com boards as a database. Users select from filtered options that progressively narrow down choices, then creates items on a destination Monday board.

**Tech Stack:** React, TypeScript, Vite
**Repository:** `ChrisGelles/MondayFormFixer` on GitHub
**Deployment:** Vercel (auto-deploys on push to master)

## Current Issue

**Error:** `invalid value - label has been deactivated. Please check our API documentation for the correct data structure for this column.`

This error occurs when submitting the form. One of the status/dropdown columns is receiving a value that has been deactivated in the destination board.

## Key Files

### Main Form Component
- **File:** `src/components/FlexibleFilterForm.tsx`
- **Purpose:** Main form component that handles user input and submission
- **Key Function:** `handleSubmit()` (around line 523) - builds `columnValues` object and sends to destination board

### Column Mapping (Lines 555-619)
The destination board columns are populated here:

```typescript
const columnValues: Record<string, any> = {
  // User Information
  text_mkwrbr6p: requesterName,                    // Requester Name
  email_mkwr1ham: { email: email, text: email },   // Email
  text_mkwr3hq0: department || '',                 // Department
  text_mkwrh03s: eventDuration,                    // Event Duration
  text_mkwrjgwf: requesterDescription,             // Requester Description
  
  // Engagement from source board
  text_mkwrmbrf: selectedEngagementDetails?.name,  // Engagement Name
  text_mkwrhk6d: selectedEngagementDetails?.description || '', // Engagement Description
  
  // Date Submitted
  date_mkwsfa4p: { date: submittedDate, time: submittedTime },
  
  // Filter values (status/dropdown columns - THESE ARE THE PROBLEM)
  color_mkwrzjh2: { label: paCategory },           // Theme (status)
  color_mkwr6zfj: { label: depth },                 // Depth (status)
  dropdown_mkwr1011: { labels: [type] },           // Type (dropdown)
  color_mkwr3jx0: { label: audience },              // Audience (status)
};
```

### Service Layer
- **File:** `src/services/mondayService.ts`
- **Key Method:** `createItem()` - sends GraphQL mutation to Monday.com API

## Problem Columns

The error is likely coming from one of these status/dropdown columns:
1. `color_mkwrzjh2` - Theme/PA Category (status column)
2. `color_mkwr6zfj` - Depth (status column)
3. `dropdown_mkwr1011` - Type (dropdown column)
4. `color_mkwr3jx0` - Audience (status column)

## How Values Are Retrieved

Values come from `getFilterValue()` function (lines 598-609):
- First checks if user manually set the filter (`filterSelections`)
- Otherwise gets from engagement item in source board (`engagementItem.column_values`)

**Source Board Column IDs:**
- Theme: `color_mkvnrc08`
- Depth: `color_mkvnyaj9`
- Type: `dropdown_mkvn675a`
- Audience: `color_mkvnh5kw`

## Debugging Steps

1. **Add console logging** before `createItem()` call to see what values are being sent:
   ```typescript
   console.log('🔍 VALUES BEING SENT:', {
     paCategory,
     depth,
     type,
     audience,
     columnValues: JSON.stringify(columnValues, null, 2)
   });
   ```

2. **Query destination board** to see what labels are active:
   ```bash
   curl -X POST https://api.monday.com/v2 \
     -H "Authorization: YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -H "API-Version: 2024-10" \
     -d '{"query":"query ($boardId: [ID!]) { boards(ids: $boardId) { name columns { id title type settings_str } } }","variables":{"boardId":["YOUR_DESTINATION_BOARD_ID"]}}'
   ```

3. **Check source board values** - what values are actually in the source board that might not match destination labels

4. **Compare source vs destination** - create a mapping function if values don't match exactly

## Previous Attempts

- **Attempt 1:** Added `normalizeTypeForDestination()` function to map "Gallery Talk, Tabling" → "Tabling/Gallery Talk"
  - **Status:** Removed by user (see git history)
  
- **Attempt 2:** Changed `text_mkwrmbrf` to use `selectedEngagementDetails?.name` instead of `selectedEngagement` (ID)
  - **Status:** ✅ This fix is still in place

## Next Steps

1. **Identify the problematic column:**
   - Add debug logging to see actual values being sent
   - Check browser console on Vercel deployment
   - Compare with active labels in destination board

2. **Create normalization/mapping:**
   - If source board values don't match destination labels exactly
   - Map source values to destination labels
   - Handle case-insensitive matching
   - Handle deactivated labels

3. **Test:**
   - Deploy to Vercel
   - Test form submission
   - Verify all columns populate correctly

## Environment Variables (Vercel)

- `VITE_MONDAY_API_TOKEN` - Required
- `VITE_SOURCE_BOARD_ID` - Optional (defaults to 10021032653)
- `VITE_DESTINATION_BOARD_ID` - Optional (can be set in UI)

## Git Status

- **Current branch:** master
- **Last commit:** Debug logging was added then removed
- **Working state:** Form works but throws error on submission due to deactivated label

## Important Notes

- **DO NOT** change the engagement selection dropdown logic - it works perfectly
- **DO NOT** change how filter values are retrieved from source board
- **ONLY** fix the mapping/normalization of values before sending to destination board
- The issue is that source board values don't match destination board dropdown/status labels exactly

## Quick Reference

**Destination Board Column IDs:**
- Requester Name: `text_mkwrbr6p`
- Email: `email_mkwr1ham`
- Department: `text_mkwr3hq0`
- Event Duration: `text_mkwrh03s`
- Requester Description: `text_mkwrjgwf`
- Engagement Name: `text_mkwrmbrf` ✅ Fixed - uses name not ID
- Engagement Description: `text_mkwrhk6d`
- Date Submitted: `date_mkwsfa4p`
- Event Date/Time: `date4`
- Theme: `color_mkwrzjh2` ⚠️ Check this
- Depth: `color_mkwr6zfj` ⚠️ Check this
- Type: `dropdown_mkwr1011` ⚠️ Check this
- Audience: `color_mkwr3jx0` ⚠️ Check this

## Contact/Context

- User was frustrated with previous attempts that broke things
- Reverted to Dec 1 commit (`8a1aebe`) multiple times
- Current version has the engagement name fix but needs the deactivated label issue resolved
- User prefers working on Vercel builds rather than local dev server



