# Canonical Selectors

All components MUST use these exact `data-testid` values for testing and automation.

## Layout Selectors

- `app-shell` - Main application container
- `thread-tray` - Left sidebar containing threads
- `chat-pane` - Main chat interface area

## Thread Management

- `new-thread` - Button to create new chat thread
- `thread-list` - Container for thread items
- `thread-item` - Individual thread in sidebar (use with data-thread-id)
- `thread-title` - Active thread title in header

## Chat Interface

- `model-switcher` - Dropdown for selecting AI model
- `transcript` - Scrollable message history container
- `message` - Individual message (use with data-role="user|assistant")
- `typing-indicator` - Shows when assistant is typing
- `composer` - Message input form container
- `composer-input` - Textarea for typing messages
- `composer-send` - Submit button for sending messages

## State Indicators

- `empty-state` - Shown when no threads exist
- `loading-state` - Shown during loading operations
- `error-state` - Shown when errors occur

## Additional Data Attributes

Use these with selectors for more specific targeting:

- `data-thread-id="t_123"` - Unique thread identifier
- `data-message-id="m_456"` - Unique message identifier  
- `data-role="user|assistant"` - Message sender type
- `data-active="true"` - Currently selected/active item
- `data-provider="openai|anthropic"` - AI provider for messages
- `data-model="gpt-4o"` - Specific model used
- `aria-busy="true"` - Loading state indicator
- `aria-expanded="true|false"` - Expandable UI state

## Example Usage

```javascript
// Select active thread
page.getByTestId('thread-item').filter({ hasAttr: 'data-active' })

// Select user messages
page.getByTestId('message').filter({ hasAttr: 'data-role="user"' })

// Wait for typing to finish
await page.getByTestId('typing-indicator').waitFor({ state: 'hidden' })

// Select specific thread
page.getByTestId('thread-item').filter({ hasAttr: 'data-thread-id="t_123"' })
```

## Testing Contract

These selectors form a **contract** between:
- Frontend components (must add these exact testids)
- E2E tests (must target these exact testids)  
- Manual testing scripts
- Accessibility tools
- Browser automation

**Never change these selectors without updating all dependent tests.**