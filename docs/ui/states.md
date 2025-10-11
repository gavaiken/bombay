# Component States

## ThreadTray

### Empty State
- **Condition**: `threads.length === 0`
- **Display**: Show message "No conversations yet" in thread-list area
- **Selector**: `[data-testid="empty-state"]` with text content
- **Actions**: Only new-thread button available

### Loading State  
- **Condition**: Initial load or refresh
- **Display**: `aria-busy="true"` on thread-tray, skeleton loaders for thread items
- **Selector**: `[data-testid="thread-tray"][aria-busy="true"]`
- **Behavior**: Disable interactions until loaded

### Error State
- **Condition**: Failed to load threads
- **Display**: `role="alert"` with error message and retry button
- **Selector**: `[data-testid="error-state"]`
- **Recovery**: Retry button triggers reload

### Normal State
- **Display**: List of thread-item components
- **Behavior**: One thread marked `data-active="true"`
- **Interactions**: Click to select, hover effects

## ChatPane

### No Thread Selected
- **Condition**: `activeThreadId === null`
- **Display**: Empty state with welcome message
- **Content**: "Select a conversation or start a new one"
- **Components**: Only new-thread button visible

### Loading Thread
- **Condition**: Thread selected but messages not loaded
- **Display**: `aria-busy="true"` on chat-pane
- **Transcript**: Skeleton message bubbles
- **Composer**: Disabled during load

## Transcript

### Empty Conversation
- **Condition**: `messages.length === 0`
- **Display**: Helper text "Say hello to start chatting"
- **Selector**: `[data-testid="empty-state"]` within transcript
- **Styling**: Centered, muted text

### Loading Response
- **Condition**: Waiting for assistant reply
- **Display**: `[data-testid="typing-indicator"]` visible
- **Animation**: Animated dots or pulse effect
- **Behavior**: Auto-scroll to keep indicator visible

### Long Conversation
- **Condition**: Messages overflow container height
- **Behavior**: 
  - Transcript scrolls vertically
  - Auto-scroll to bottom on new messages
  - Preserve scroll position when reviewing history
- **Styling**: Fade gradient at top when scrolled

### Error State
- **Condition**: Failed to send message or get response
- **Display**: `role="alert"` within transcript
- **Content**: Error message with retry option
- **Recovery**: Allow resending last message

## Message

### User Message
- **Styling**: Right-aligned, blue background
- **Content**: Plain text with line breaks
- **Timestamp**: On hover or always visible

### Assistant Message  
- **Styling**: Left-aligned, light background
- **Content**: Rendered markdown (bold, italic, code, lists)
- **Metadata**: Model used, timestamp
- **States**: streaming (partial content), complete, failed

### Streaming Message
- **Condition**: Assistant message being generated
- **Display**: Partial content with typing cursor
- **Behavior**: Content updates in real-time
- **Completion**: Cursor disappears, full content visible

## Composer

### Default State
- **Input**: Empty textarea, placeholder "Message..."
- **Button**: Send button disabled
- **Height**: Auto-resize based on content (min 2 rows, max 8 rows)

### Focused State
- **Input**: Focus ring, placeholder disappears
- **Keyboard**: 
  - Enter submits (if content exists)
  - Shift+Enter adds line break
  - Up arrow recalls last message (empty input only)

### Has Content
- **Input**: Text present, auto-resized
- **Button**: Send button enabled and highlighted
- **Validation**: Trim whitespace, block empty submissions

### Disabled State
- **Condition**: While sending message or loading
- **Display**: `disabled` attribute on input and button
- **Styling**: Muted appearance
- **Behavior**: No interactions possible

### Error State
- **Condition**: Message failed to send
- **Display**: Error styling on input border
- **Recovery**: Allow editing and retry

## ModelSwitcher

### Default State
- **Display**: Currently selected model as dropdown value
- **Options**: Grouped by provider (OpenAI, Anthropic)
- **Format**: "Provider — Model Name"

### Loading Models
- **Display**: Disabled with loading indicator
- **Fallback**: Show cached options if available

### Changing Model
- **Behavior**: 
  - Update immediately on selection
  - Persist to thread settings
  - Show brief confirmation
  - Apply to subsequent messages only

## Global Loading States

### App Initialization
- **Display**: Loading spinner or skeleton layout
- **Behavior**: Block all interactions
- **Timeout**: Show error if load takes >10 seconds

### Background Updates
- **Display**: Subtle loading indicators
- **Behavior**: Non-blocking, allow continued use
- **Examples**: Saving draft, syncing changes

## Responsive States

### Mobile (< 768px)
- **ThreadTray**: Overlay panel, collapsible
- **ChatPane**: Full width when thread selected
- **Composer**: Larger touch targets, adjusted sizing

### Tablet (768px - 1024px)  
- **ThreadTray**: Narrower sidebar (240px)
- **Layout**: Maintain side-by-side layout
- **Text**: Ensure readable sizing

### Desktop (> 1024px)
- **ThreadTray**: Full width sidebar (280px)
- **ChatPane**: Optimal reading width
- **Shortcuts**: Show keyboard shortcuts in tooltips