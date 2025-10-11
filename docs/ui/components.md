# Component Inventory

## Layout Components

### AppShell
- **Purpose**: Main layout container with sidebar and content area
- **Structure**: CSS Grid with 280px sidebar + flexible main area
- **Props**: None (layout container)
- **Children**: ThreadTray, ChatPane

### ThreadTray
- **Purpose**: Sidebar containing thread list and navigation
- **Structure**: Vertical stack with header + scrollable list
- **Props**: `threads: Thread[]`, `activeThreadId: string`, `onThreadSelect: (id) => void`
- **Children**: NewThreadButton, ThreadList

### ChatPane  
- **Purpose**: Main chat interface
- **Structure**: Header + Transcript + Composer
- **Props**: `thread: Thread`, `messages: Message[]`, `onSendMessage: (content) => void`
- **Children**: ChatHeader, Transcript, Composer

## Interactive Components

### NewThreadButton
- **Purpose**: Creates a new chat thread
- **Structure**: Button with icon + text
- **Props**: `onClick: () => void`, `disabled?: boolean`
- **States**: default, hover, active, disabled

### ThreadList
- **Purpose**: Scrollable list of chat threads
- **Structure**: Unordered list of ThreadItem components
- **Props**: `threads: Thread[]`, `activeId: string`, `onSelect: (id) => void`
- **Children**: ThreadItem[]

### ThreadItem
- **Purpose**: Individual thread in the sidebar
- **Structure**: Button with title + metadata
- **Props**: `thread: Thread`, `active: boolean`, `onClick: () => void`
- **States**: default, hover, active
- **Data**: title, lastMessage preview, timestamp, model

### ChatHeader
- **Purpose**: Top bar with thread title and model selector
- **Structure**: Flex container with title + controls
- **Props**: `thread: Thread`, `onModelChange: (model) => void`
- **Children**: ThreadTitle, ModelSwitcher

### ModelSwitcher
- **Purpose**: Dropdown to select AI model for current thread
- **Structure**: Select element with provider grouping
- **Props**: `value: string`, `options: ModelOption[]`, `onChange: (value) => void`
- **Data**: provider (OpenAI, Anthropic), model name

### Transcript
- **Purpose**: Scrollable chat message history
- **Structure**: Scrollable container with message list
- **Props**: `messages: Message[]`, `loading: boolean`
- **Children**: Message[], TypingIndicator
- **Behavior**: Auto-scroll to bottom on new messages

### Message
- **Purpose**: Individual chat message bubble
- **Structure**: Container with role styling + content
- **Props**: `message: Message`, `role: 'user' | 'assistant'`
- **Variants**: user (right-aligned), assistant (left-aligned)
- **Data**: content (markdown), timestamp, model (for assistant)

### TypingIndicator
- **Purpose**: Shows when assistant is generating response  
- **Structure**: Animated dots with "typing" text
- **Props**: `visible: boolean`
- **States**: hidden, visible (animated)

### Composer
- **Purpose**: Message input area with send button
- **Structure**: Form with textarea + submit button
- **Props**: `onSubmit: (content) => void`, `disabled: boolean`
- **Behavior**: Enter submits, Shift+Enter new line, auto-resize
- **States**: default, focused, disabled (while sending)

## Data Types

```typescript
interface Thread {
  id: string;
  title: string;
  activeModel: string; // "provider:model" format
  updatedAt: string; // ISO date
  messageCount?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string; // for assistant messages
  model?: string; // for assistant messages
  timestamp: string; // ISO date
}

interface ModelOption {
  id: string; // "provider:model"
  label: string; // "Provider — Model Name"
  provider: string;
  model: string;
}
```