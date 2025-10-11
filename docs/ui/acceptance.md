# UI Acceptance Criteria

## Core Functionality Tests

### A1: Application Shell Renders
**Test**: Page loads with basic layout structure
**Steps**:
1. Navigate to app URL
2. Wait for initial load

**Expected**: 
- `[data-testid="app-shell"]` is present and visible
- `[data-testid="thread-tray"]` is present in left column
- `[data-testid="chat-pane"]` is present in right column
- No JavaScript console errors

### A2: Fixture Data Loads
**Test**: App loads with sample data from fixtures
**Steps**:
1. App initialization completes
2. Check thread list population

**Expected**:
- Thread list contains exactly 5 thread items
- First thread has `data-active="true"`
- Thread titles match fixture data:
  - "SEO plan for new website"
  - "Refactor React components" 
  - "Database schema design"
  - "API documentation review"
  - "Performance optimization"

### A3: Thread Selection Works
**Test**: Clicking threads switches active conversation
**Steps**:
1. Note currently active thread title in header
2. Click second `[data-testid="thread-item"]`
3. Verify UI updates

**Expected**:
- Previously active thread loses `data-active="true"`
- Clicked thread gains `data-active="true"`
- `[data-testid="thread-title"]` text updates to "Refactor React components"
- Model switcher updates to "Anthropic — Claude 3.5 Sonnet"

### A4: Model Switcher Functions
**Test**: Changing model updates thread settings
**Steps**:
1. Select first thread (GPT-4o)
2. Change `[data-testid="model-switcher"]` to "anthropic:claude-3-5-sonnet"
3. Switch to different thread and back

**Expected**:
- Dropdown value updates immediately to selected model
- Thread retains model selection when revisited
- API call made to persist change (if backend connected)

### A5: Message Sending Flow
**Test**: Complete send message interaction
**Steps**:
1. Select active thread
2. Type "Hello, can you help me?" in `[data-testid="composer-input"]`
3. Click `[data-testid="composer-send"]`
4. Wait for response

**Expected**:
- Message appears as user message (right-aligned, blue background)
- `[data-testid="typing-indicator"]` becomes visible
- Composer input clears and becomes disabled during response
- Assistant message appears (left-aligned, gray background)
- Typing indicator disappears when complete
- Composer re-enables for next message

## State Management Tests  

### A6: Empty States Display
**Test**: Proper empty state handling
**Steps**:
1. Mock API to return empty threads array
2. Reload application

**Expected**:
- Thread tray shows `[data-testid="empty-state"]` with "No conversations yet"
- Chat pane shows welcome message
- New thread button remains available

### A7: Loading States Appear
**Test**: Loading indicators during async operations
**Steps**:
1. Slow down API responses (via dev tools or mock delay)
2. Trigger thread loading

**Expected**:
- `[data-testid="thread-tray"][aria-busy="true"]` during thread list load
- Skeleton UI or loading placeholders visible
- `[data-testid="typing-indicator"]` during message generation

### A8: Error States Handle Gracefully
**Test**: Error recovery mechanisms work
**Steps**:
1. Mock API to return error responses
2. Attempt to load threads
3. Click retry button

**Expected**:
- `[data-testid="error-state"]` appears with error message
- Retry button triggers new load attempt
- Success recovery returns to normal state

## User Experience Tests

### A9: Keyboard Shortcuts Work
**Test**: Key combinations trigger expected actions
**Steps**:
1. Press `Cmd+N` (Mac) or `Ctrl+N` (Windows)
2. Press `Enter` in composer with text
3. Press `Shift+Enter` in composer

**Expected**:
- `Cmd+N` creates new thread and focuses composer
- `Enter` sends message (if composer not empty)
- `Shift+Enter` adds line break without sending

### A10: Responsive Layout Adapts
**Test**: Interface adjusts to screen size
**Steps**:
1. Resize browser window to mobile width (< 768px)
2. Verify layout changes
3. Test thread navigation on mobile

**Expected**:
- Thread tray becomes overlay/modal on mobile
- Chat pane takes full width
- Touch-friendly button sizes
- Functionality remains accessible

### A11: Long Content Scrolls Properly
**Test**: Scroll behavior in transcript
**Steps**:
1. Load thread with many messages (or mock long conversation)
2. Scroll up in transcript
3. Send new message

**Expected**:
- Transcript scrolls vertically when content overflows
- Auto-scroll to bottom when new message arrives
- Scroll position preserved when switching threads
- Smooth scrolling animation

## Accessibility Tests

### A12: Semantic HTML Structure
**Test**: Screen reader compatibility
**Steps**:
1. Run automated accessibility scan (axe-core)
2. Navigate with keyboard only
3. Check ARIA labels

**Expected**:
- No axe violations (Level AA compliance)
- All interactive elements focusable via keyboard
- `role="main"` on chat pane
- `role="alert"` on error states
- Proper heading hierarchy (h1, h2, etc.)

### A13: Focus Management
**Test**: Logical tab order and focus indicators
**Steps**:
1. Tab through interface
2. Send message and verify focus
3. Open new thread

**Expected**:
- Focus moves logically: new thread → thread list → model switcher → composer
- Focus indicators clearly visible
- Focus moves to composer input when starting new thread
- Focus returns to composer after sending message

## Performance Tests

### A14: Fast Initial Load
**Test**: Application loads within acceptable time
**Steps**:
1. Clear cache and reload
2. Measure load time
3. Check network requests

**Expected**:
- Page interactive within 3 seconds on fast 3G
- Minimal JavaScript bundle size
- Critical CSS inline, non-critical deferred
- Fixtures load from cache or CDN

### A15: Smooth Interactions
**Test**: UI remains responsive during use
**Steps**:
1. Type rapidly in composer
2. Switch between threads quickly
3. Scroll through long conversations

**Expected**:
- No input lag or dropped keystrokes
- Thread switching completes < 200ms
- Scrolling maintains 60fps
- No memory leaks during extended use

## Integration Tests

### A16: Mock API Consistency
**Test**: UI works correctly with mocked backend
**Steps**:
1. Verify all fixture data loads
2. Test CRUD operations (if applicable)
3. Check error scenarios

**Expected**:
- GET /api/threads returns threads.json
- GET /api/messages?threadId=t_1 returns messages.json["t_1"]
- POST /api/messages accepts and returns new message
- Error responses trigger appropriate UI states

### A17: Real API Compatibility
**Test**: UI works when connected to actual backend
**Steps**:
1. Switch from mocks to real API
2. Test core user flows
3. Verify data persistence

**Expected**:
- All selectors and data flow remain unchanged
- Real API responses match mock structure
- WebSocket streaming works for real-time messages
- Authentication and error handling functional

## Browser Compatibility

### A18: Cross-Browser Support
**Test**: Core functionality in major browsers
**Steps**:
1. Test in Chrome, Firefox, Safari, Edge
2. Verify mobile Safari and Chrome
3. Check older browser versions

**Expected**:
- Visual consistency across browsers
- JavaScript features polyfilled as needed
- CSS Grid and Flexbox support
- WebSocket or fallback for real-time features

## Data Validation

### A19: Input Sanitization
**Test**: User input handled safely
**Steps**:
1. Enter HTML/JavaScript in composer
2. Test extremely long messages
3. Try special characters and Unicode

**Expected**:
- HTML escaped in message display
- XSS prevention active
- Long messages truncated with warning
- Unicode characters display correctly

## Brand Validation Tests

### B1: IBM Plex Mono Font Applied
**Test**: Body font is IBM Plex Mono
**Steps**:
1. Load application
2. Check computed font-family on body element

**Expected**:
- `getComputedStyle(document.body).fontFamily` includes "IBM Plex Mono"
- Font loads successfully from Google Fonts
- Monospace characteristics visible in UI text

### B2: Dark Theme Variables Present
**Test**: CSS custom properties are correctly applied
**Steps**:
1. Verify body has `data-theme="dark"` attribute
2. Check CSS custom property values

**Expected**:
- `document.body.getAttribute('data-theme') === 'dark'`
- `getComputedStyle(document.documentElement).getPropertyValue('--color-bg')` equals `#0B1220` (or RGB equivalent)
- `getComputedStyle(document.documentElement).getPropertyValue('--color-brand-500')` equals `#FF2E88`
- All brand color variables are accessible

### B3: Brand Gradient Exists
**Test**: Brand gradient is properly defined and usable
**Steps**:
1. Find element with brand gradient (test swatch)
2. Verify background-image contains linear-gradient

**Expected**:
- `page.locator('[data-testid="brand-swatch"]').hasCSS('background-image', /linear-gradient/i)`
- Gradient transitions from #FF2E88 to #FF72B6
- Visual verification shows smooth pink gradient

### B4: Brand Color Accessibility
**Test**: Brand colors meet contrast requirements
**Steps**:
1. Test brand-500 on panel backgrounds
2. Verify text remains readable
3. Check focus ring visibility

**Expected**:
- Brand-500 (#FF2E88) on panel backgrounds meets WCAG AA contrast
- Focus rings with `ring-pink-400/40` are visible against dark background
- No text uses brand colors on colored backgrounds (maintains neutral text)

### B5: Favicon and Metadata
**Test**: Brand assets load correctly
**Steps**:
1. Check favicon is present in document head
2. Verify favicon.svg is accessible
3. Validate metadata

**Expected**:
- `<link rel="icon" href="/favicon.svg">` present in HTML
- `GET /favicon.svg` returns 200 status
- Title is lowercase "bombay"
- Theme color is set to #0B1220
