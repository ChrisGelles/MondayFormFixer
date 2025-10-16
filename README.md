# Monday Form Fixer

A standalone web application that creates cascading forms using Monday.com boards as a database. This app allows users to select from filtered options that progressively narrow down choices, then creates items on a destination Monday board based on those selections.

## Features

- 🔐 **Secure Authentication**: Connect using your Monday.com API token
- 📊 **Dynamic Data**: Reads options from a Monday board in real-time
- 🎯 **Cascading Dropdowns**: Each selection filters the next set of options
- ✨ **Auto-Create Items**: Automatically creates items on a destination board
- ⚙️ **Configurable**: Set up board IDs and column mappings through the UI
- 💾 **Persistent Settings**: Saves your API token locally for convenience

## How It Works

1. **Source Board**: Define a Monday board that contains all your option data
2. **Cascading Selection**: User selects from progressively filtered dropdowns
3. **Destination Board**: Selected data creates new items on a different board

### Example Use Case

Source board has columns like:
- Department
- Team
- Role
- Equipment Type

The form shows:
1. User selects "Engineering" → 
2. Shows only teams in Engineering → User selects "Backend" →
3. Shows only roles in Backend team → User selects "Senior Developer" →
4. Shows equipment for that role → User selects "MacBook Pro" →
5. Creates item on destination board with all selections

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Monday.com account with:
  - An API token
  - A source board with your options data
  - A destination board where items will be created

### Installation

1. Clone or download this repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the URL shown (usually http://localhost:5173)

## Configuration

### Getting Your Monday API Token

1. Log in to Monday.com
2. Click your profile picture (bottom left)
3. Select **Developers**
4. Click **My Access Tokens**
5. Either show your personal token or create a new one
6. Copy the token

### Finding Board IDs

Board IDs are in the URL when viewing a board:
```
https://yourworkspace.monday.com/boards/1234567890
                                          ^^^^^^^^^^
                                          This is your Board ID
```

### Finding Column IDs

There are several ways to find column IDs:

**Method 1: Browser Console**
1. Open the Monday board in your browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run: `monday.get('context')`
5. Look for column information in the response

**Method 2: API Explorer**
1. Visit https://monday.com/developers/v2/try-it-yourself
2. Use this query:
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

**Common Column IDs:**
- `text` - First text column
- `text0`, `text1`, etc. - Additional text columns
- `status` - Status column
- `dropdown` - Dropdown column
- `person` - People column

### Setting Up Your Form

1. **Connect to Monday**: Enter your API token
2. **Configure Boards**: 
   - Enter your Source Board ID
   - Enter your Destination Board ID
3. **Define Cascade Steps**:
   - For each step, provide:
     - Label (what the user sees)
     - Column ID (which column to read from)
4. **Start Using**: Once configured, the form will appear below

## Usage

1. **First Dropdown**: Loads all unique values from the first column
2. **Select Option**: Choose a value
3. **Next Dropdown**: Automatically loads filtered options based on your selection
4. **Continue**: Repeat until all dropdowns are complete
5. **Submit**: Click "Create Item" to create a new item on the destination board

## API Reference

### MondayService

The app includes a comprehensive Monday.com API service with these methods:

- `getBoardItems(boardId)` - Get all items from a board
- `getBoardColumns(boardId)` - Get column information
- `getUniqueColumnValues(boardId, columnId)` - Get unique values from a column
- `getFilteredColumnValues(boardId, targetColumnId, filters)` - Get filtered values
- `createItem(boardId, itemName, columnValues)` - Create a new item
- `testConnection()` - Test API connection

### Example: Creating Items Programmatically

```typescript
import { getMondayService } from './services/mondayService';

const service = getMondayService();

await service.createItem(
  'destination_board_id',
  'Item Name',
  {
    text: 'Some value',
    status: 'Working on it',
    text0: 'Another value'
  }
);
```

## Development

### Project Structure

```
MondayFormFixer/
├── src/
│   ├── components/
│   │   ├── CascadingForm.tsx       # Main form component
│   │   └── CascadingForm.css       # Form styles
│   ├── services/
│   │   └── mondayService.ts        # Monday API integration
│   ├── App.tsx                     # Main app component
│   ├── App.css                     # App styles
│   └── main.tsx                    # Entry point
├── package.json
└── README.md
```

### Building for Production

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

### Deployment

Deploy the `dist` folder to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use `gh-pages` package
- **Any static host**: Upload the `dist` folder

## Troubleshooting

### "Failed to connect to Monday.com"
- Verify your API token is correct
- Check that your token has appropriate permissions
- Ensure you're connected to the internet

### "No options available"
- Verify the Board ID is correct
- Check that the Column ID matches your board's columns
- Ensure the column has data
- Make sure previous selections have matching data

### Items not creating properly
- Verify Destination Board ID is correct
- Check that column IDs match the destination board's structure
- Ensure you have write permissions on the destination board

### Column values not matching
- Different column types (text, status, dropdown) may require different value formats
- Use the Monday API explorer to check the correct format for your column type

## Advanced Usage

### Customizing the Form

You can modify the number of cascade steps by editing the initial state in `App.tsx`:

```typescript
const [cascadeSteps, setCascadeSteps] = useState([
  { id: 'step1', label: 'First Choice', columnId: '' },
  { id: 'step2', label: 'Second Choice', columnId: '' },
  { id: 'step3', label: 'Third Choice', columnId: '' },
  { id: 'step4', label: 'Fourth Choice', columnId: '' }, // Add more as needed
]);
```

### Creating Multiple Items

Modify the submit handler in `CascadingForm.tsx` to use `createMultipleItems`:

```typescript
await mondayService.createMultipleItems(boardId, [
  { name: 'Item 1', columnValues: {...} },
  { name: 'Item 2', columnValues: {...} },
]);
```

## Monday.com API Resources

- [Monday API Documentation](https://developer.monday.com/api-reference/docs)
- [GraphQL Explorer](https://monday.com/developers/v2/try-it-yourself)
- [API Community Forum](https://community.monday.com/c/developers)

## License

MIT License - feel free to use this for any purpose

## Support

For issues related to:
- **This app**: Check the troubleshooting section above
- **Monday.com API**: Visit the [Monday Developer Community](https://community.monday.com/c/developers)
- **React/Vite**: Check their respective documentation

---

Built with React, TypeScript, and the Monday.com API
