# User Flows

## Primary Flows

### 1. Start New Conversation
**Trigger**: Click "New Chat" button or keyboard shortcut (Cmd+N)

1. Click `[data-testid="new-thread"]` button
2. UI creates new thread with default title "New Chat"
3. Thread appears at top of thread-list with `data-active="true"`
4. Chat pane shows empty transcript with welcome message
5. Composer input is focused and ready
6. Model switcher shows user's default model

**Expected Result**: Empty conversation ready for first message

### 2. Send Message
**Trigger**: Type message and press Enter or click Send

1. User types in `[data-testid="composer-input"]`
2. Send button becomes enabled when content exists
3. User presses Enter OR clicks `[data-testid="composer-send"]`
4. Message appears in transcript as user message (right-aligned)
5. Composer input clears and becomes disabled
6. Typing indicator `[data-testid="typing-indicator"]` appears
7. Assistant response streams in (left-aligned)
8. Typing indicator disappears when response complete
9. Composer re-enables for next message

**Expected Result**: Conversation continues with user and assistant messages

### 3. Switch Between Threads
**Trigger**: Click thread in sidebar

1. User clicks `[data-testid="thread-item"]`
2. Previously active thread loses `data-active="true"`
3. Clicked thread gains `data-active="true"` and visual highlight
4. Chat header title updates to selected thread title
5. Model switcher updates to thread's active model
6. Transcript loads with thread's message history
7. Composer remains available for new messages

**Expected Result**: Different conversation loaded and ready

### 4. Change AI Model
**Trigger**: Select different model from dropdown

1. User opens `[data-testid="model-switcher"]` dropdown
2. User selects different model (e.g., "anthropic:claude-3-5-sonnet")
3. Dropdown value updates immediately
4. Change persists to thread settings (background save)
5. Subsequent messages in this thread use new model
6. Previous messages remain unchanged with their original model

**Expected Result**: New model applies to future messages only

### 5. Handle Empty States
**Trigger**: User with no threads or selected thread with no messages

**No Threads (First Time User)**:
1. App loads with empty thread-list
2. `[data-testid="empty-state"]` visible in thread tray
3. Chat pane shows welcome message and "New Chat" prompt
4. Only available action is creating first thread

**No Messages (New Thread)**:
1. Thread selected but no messages sent yet
2. Transcript shows `[data-testid="empty-state"]` with "Say hello..."
3. Composer is active and focused
4. Model switcher available for selection

## Secondary Flows

### 6. Error Recovery
**Trigger**: Network error or API failure

**Failed to Load Threads**:
1. `[data-testid="error-state"]` appears in thread tray
2. Retry button allows user to reload
3. Loading state shows during retry attempt

**Failed to Send Message**:
1. Message shows error state (red border on composer)
2. User can edit message and retry
3. Error message explains what went wrong

**Failed to Load Messages**:
1. Thread selected but messages won't load
2. Transcript shows error state with retry option
3. Thread remains selectable while retrying

### 7. Long Conversation Management
**Trigger**: Thread with many messages

1. Transcript scrolls vertically when content overflows
2. New messages auto-scroll to bottom
3. User can scroll up to read history
4. Scroll position preserved when switching threads
5. Visual indicator (fade gradient) when scrolled up

### 8. Responsive Behavior
**Trigger**: Screen size changes or mobile device

**Mobile (< 768px)**:
1. Thread tray becomes overlay/modal
2. Chat pane takes full width
3. Header includes menu button to show/hide threads
4. Composer adjusts for touch input

**Tablet/Desktop**:
1. Side-by-side layout maintained
2. Thread tray width adjusts (240px → 280px)
3. Keyboard shortcuts available

## Keyboard Shortcuts

### Global Shortcuts
- `Cmd+N` (Mac) / `Ctrl+N` (Windows): New thread
- `Cmd+/` (Mac) / `Ctrl+/` (Windows): Show shortcuts help
- `Esc`: Close modals/overlays

### Composer Shortcuts
- `Enter`: Send message (if not empty)
- `Shift+Enter`: New line in message
- `↑` (Up Arrow): Recall last message (when input empty)
- `Cmd+Enter`: Force send (override any validation)

### Navigation Shortcuts
- `Cmd+1-9`: Switch to thread by position
- `Cmd+↑/↓`: Navigate between threads
- `Tab`: Focus next interactive element
- `Shift+Tab`: Focus previous interactive element

## Input Validation

### Composer Input
- **Empty Messages**: Send button disabled, Enter does nothing
- **Whitespace Only**: Trim whitespace, treat as empty
- **Maximum Length**: Warn at 4000 characters, block at 5000
- **Special Characters**: Allow all Unicode, preserve formatting

### Model Switching
- **While Typing**: Allow model changes while composing
- **During Streaming**: Disable model switcher while response generating
- **Invalid Selection**: Fallback to thread's last working model

## Loading States & Timing

### Fast Actions (< 200ms)
- Thread switching: Instant UI update, lazy load messages
- Model switching: Immediate dropdown update
- Typing: Real-time input feedback

### Medium Actions (200ms - 2s)
- Loading thread messages: Show skeleton messages
- Creating new thread: Show in list immediately, save in background
- Sending message: Show optimistically, retry on failure

### Slow Actions (> 2s)
- AI response generation: Show typing indicator
- Initial app load: Show loading screen
- Network reconnection: Show connection status

## Error Handling Patterns

### Recoverable Errors
- Network timeouts: Auto-retry with exponential backoff
- Rate limiting: Show cooldown timer and retry
- Temporary API errors: Show retry button

### Non-Recoverable Errors  
- Invalid API keys: Redirect to settings
- Account suspended: Show account status message
- Browser incompatibility: Show upgrade message

### User Input Errors
- Invalid characters: Filter during typing
- Message too long: Show character count warning
- Empty required fields: Disable submit and show helper text