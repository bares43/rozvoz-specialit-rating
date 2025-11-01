# Rozvoz Specialit Rater - Chrome Extension

## Project Overview

This is a Chrome browser extension that enhances the user experience on RozvozSpecialit.cz (a Czech lunch delivery website) by allowing users to rate lunch items with thumbs up/down buttons and track their preferences over time.

## What This Project Does

The extension adds interactive rating functionality to lunch menus on RozvozSpecialit.cz:

- **Visual Rating System**: Adds thumbs up/down buttons next to each lunch item
- **Persistent Storage**: Saves user ratings using Chrome's local storage API
- **Visual Feedback**: 
  - Liked items appear in **bold text**
  - Disliked items appear with ~~strikethrough text~~
  - Active rating buttons are highlighted in green (like) or red (dislike)
- **Management Interface**: Options page to view, add, remove, and export/import ratings

## Architecture & Components

### Core Files Structure

```
src/
├── manifest.json          # Extension configuration and permissions
├── content.js            # Main functionality injected into web pages
├── content.css           # Styling for rating buttons and text effects
├── options.html          # Settings page UI
├── options.js            # Settings page functionality
├── options.css           # Settings page styling
├── icon.png              # Extension icon
└── icons/
    ├── thumb_up.svg      # Like button icon
    └── thumb_down.svg    # Dislike button icon
```

### Key Components

#### 1. Content Script (`content.js`)
- **Purpose**: Injects rating functionality into RozvozSpecialit.cz pages
- **Key Functions**:
  - `initRater()`: Main initialization function that scans for lunch tables
  - `makeButton()`: Creates SVG-based rating buttons
  - `getRatings()`/`saveRatings()`: Chrome storage interface
- **Event Handling**: Uses MutationObserver to handle dynamic content loading
- **Data Storage**: Uses Chrome's `chrome.storage.local` API with key `lunchRatings`

#### 2. Options Page (`options.html` + `options.js`)
- **Purpose**: Management interface for user ratings
- **Features**:
  - View all liked/disliked items in separate lists
  - Manually add items to liked/disliked categories
  - Remove individual ratings
  - Export ratings to JSON file
  - Import ratings from JSON file
- **Data Format**: JSON object with dish names as keys and rating values (-1, 0, 1)

#### 3. Styling (`content.css`)
- **Button States**: Uses CSS color changes for active/inactive states
- **Text Effects**: Bold for liked items, strikethrough for disliked
- **Colors**: Green (#59a013) for likes, red (#af1a1a) for dislikes

## How It Works

### Rating System Logic
1. **Detection**: Scans for `div.offer table` elements containing lunch menus
2. **Injection**: Adds rating buttons to each table row with class `nazevjidla`
3. **State Management**: 
   - Rating values: -1 (dislike), 0 (neutral/removed), 1 (like)
   - Clicking same button toggles between active/neutral states
   - Clicking opposite button switches rating
4. **Persistence**: All ratings stored in Chrome local storage as JSON object

### Data Flow
```
User Click → Event Handler → Update Storage → Update UI → Visual Feedback
```

### Skip Logic
- Items with names in `SKIP_NAMES` set ('Dovolená', 'Státní svátek') are ignored
- Prevents rating of non-food items like holidays

## Development & Maintenance

### Key Technical Considerations

1. **Manifest V3 Compliance**: Uses modern Chrome extension APIs
2. **Async/Await Pattern**: All storage operations are asynchronous
3. **Event Delegation**: Uses MutationObserver for dynamic content
4. **SVG Icons**: Icons loaded as web-accessible resources and injected as inline SVG
5. **Data Integrity**: Handles storage errors gracefully

### Common Maintenance Tasks

#### Adding New Features
- **New Rating Types**: Modify rating scale in storage logic and add corresponding UI states
- **Additional Sites**: Add new URL patterns to `manifest.json` matches array
- **Enhanced UI**: Extend CSS classes and button creation logic

#### Debugging Issues
- **Storage Problems**: Check Chrome DevTools → Application → Storage → Local Storage
- **Content Script Issues**: Use console.log in content.js and check page console
- **Permissions**: Verify manifest.json permissions match required APIs

#### Testing Approach
1. **Manual Testing**: Load extension in Chrome Developer Mode
2. **Storage Testing**: Use Chrome DevTools to inspect stored data
3. **Cross-Page Testing**: Navigate between different lunch menu pages
4. **Options Page Testing**: Verify export/import functionality

### Code Quality Guidelines

- **Error Handling**: Always wrap storage operations in try/catch
- **Performance**: Use `dataset.raterInjected` to prevent duplicate injections
- **Accessibility**: Include proper ARIA labels on interactive elements
- **Maintainability**: Keep functions small and single-purpose

### Extension Packaging
- **Development**: Load unpacked from `src/` directory
- **Production**: Zip `src/` contents for Chrome Web Store submission
- **Version Management**: Update version in `manifest.json` for releases

## Data Schema

### Storage Format
```json
{
  "lunchRatings": {
    "Goulash with dumplings": 1,
    "Fish and chips": -1,
    "Vegetarian pasta": 1
  }
}
```

### Rating Values
- `1`: Liked (bold text, green thumb up)
- `-1`: Disliked (strikethrough text, red thumb down)  
- `0` or missing: Neutral (normal text, gray buttons)

This extension provides a simple but effective way to track lunch preferences on a specific Czech delivery website, with a clean architecture that's easy to extend and maintain.