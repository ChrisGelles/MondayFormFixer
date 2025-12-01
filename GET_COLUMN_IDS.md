# Get Monday Board Column IDs

Use these curl commands to get the column IDs from your Monday board.

## Prerequisites
Replace `YOUR_API_TOKEN` with your Monday.com API token.
Replace `10021032653` with your board ID if different.

## Get All Columns from Board

```bash
curl -X POST https://api.monday.com/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_API_TOKEN" \
  -H "API-Version: 2024-10" \
  -d '{
    "query": "query { boards(ids: [10021032653]) { columns { id title type settings_str } } }"
  }'
```

## Get Items with Column Values (to see actual data)

```bash
curl -X POST https://api.monday.com/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_API_TOKEN" \
  -H "API-Version: 2024-10" \
  -d '{
    "query": "query { boards(ids: [10021032653]) { items_page(limit: 10) { items { id name column_values { id text value type } } } } }"
  }'
```

## Get Specific Column Details (Status Column)

To check the Status column specifically:

```bash
curl -X POST https://api.monday.com/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_API_TOKEN" \
  -H "API-Version: 2024-10" \
  -d '{
    "query": "query { boards(ids: [10021032653]) { columns(ids: [\"color_mkxxab7g\"]) { id title type settings_str } } }"
  }'
```

## Expected Output Format

The response will be JSON. Look for:
- `columns[].id` - The column ID you need
- `columns[].title` - The column title (e.g., "PA Category", "Status")
- `columns[].type` - The column type (e.g., "color" for status, "dropdown" for dropdown)
- `columns[].settings_str` - JSON string with available options/labels

For status columns, check `settings_str` to see available status values like "Active".

