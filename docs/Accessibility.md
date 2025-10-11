Accessibility & ARIA in the UI

We have prioritized accessibility in the chat interface design to ensure it is usable by people with disabilities, including those using screen readers or only a keyboard. Below are the accessibility considerations and implementations:

Semantic HTML Structure: The layout uses appropriate semantic elements. For example, the thread sidebar is contained in a <nav> element with an accessible label (e.g., aria-label="Chat threads"), indicating a navigation landmark for screen readers. The main chat area is within a <main> element, signifying the primary content region of the page. This helps assistive technology users orient themselves in the app structure.

Focus Management: All interactive controls are reachable and operable via keyboard:
- The “New Chat” button is a real <button> element. Pressing Enter or Space when it’s focused will activate it, creating a new thread.
- The model selector is either a native <select> or a button that opens a list of options. In both cases, it is keyboard accessible. If it’s a custom component, we implemented it following the ARIA pattern for a combo box or menu: the toggle has aria-haspopup="listbox" and the options list has proper role (listbox with role="option" items). Up/down arrow keys navigate options, and pressing Enter selects one. It also has an accessible label (like aria-label="Model selector" if not obvious from context).
- The message input field is a <textarea> (for multi-line input) or <input> element. It’s focused by default after starting a new chat, so users can begin typing immediately. We ensure it has a visible focus outline (Tailwind’s focus ring in brand pink) and an associated label (visually hidden label like "Type a message" for screen readers).
- The “Send” button (if present as a separate button) has an aria-label="Send message" if its icon might not be descriptive. We use a standard icon with proper labeling so screen readers announce it as “Send message button”.
- Any icon-only buttons (like a possible “Copy” button on code snippets) have aria-label attributes to describe their action (e.g., "Copy code").

Chat Messages Accessibility: The chat message list is implemented as a live region so new messages are announced to screen reader users:
- The container holding messages has role="log" and aria-live="polite". The log role is ideal for chat transcripts, as it communicates that new entries will be added sequentially and should be announced politely (i.e., without interrupting the user’s current task). Screen readers will read out new messages when the user is idle.
- We ensure the log container has an accessible name. It might have aria-label="Chat messages" or be labeled by a heading (e.g., a visually hidden <h2> saying "Chat conversation with Assistant"). This way, screen readers know the context of the log.
- Each message in the log is an element such as a <div> or <li> with clear content. We prepend a hidden identifier for the speaker: for user messages, we include a visually hidden text like "User:", and for assistant messages "Assistant:". For example:
<div class="message user-message">
  <span class="sr-only">User: </span> ...user message text...
</div>
<div class="message assistant-message">
  <span class="sr-only">Assistant: </span> ...assistant message text...
</div>
This ensures that when a screen reader reads a message, it announces who is speaking. Visually, these labels are hidden (using a CSS class .sr-only).
- Timestamp or status text (if shown, e.g., “Sending…”) is also made accessible. For instance, an in-progress message might have aria-live="polite" on the status so that “Assistant is typing…” is announced.
- When new messages arrive (streaming), because the container is role="log", the screen reader will automatically announce the new content in order. We don't use aria-atomic on the log (so it only reads incremental changes). If a very long message streams in, we might consider breaking it or manually announcing certain parts, but generally the log role handles it properly.

Announcements for Events: Certain events like errors or system messages are conveyed clearly:
- If an error occurs (e.g., “Provider unavailable”), we display an error message bubble styled like an assistant message. We give it role="alert" or aria-live="assertive" because error messages should be announced immediately to the user. This way, if a screen reader user sends a message and an error comes back, they are notified without delay.
- The same goes for any critical notifications (though the app currently has minimal notifications beyond inline messages).

Color Contrast: We adhere to the contrast guidelines for text and UI elements. Our brand colors and themes were specifically chosen to be contrast compliant:
- For example, the hot pink brand-500 against the dark navy background meets WCAG AA contrast for interactive elements. We tested our color palette (buttons, text on panels, etc.) to ensure a minimum 4.5:1 contrast ratio for body text, and 3:1 for larger or UI components as applicable.
- The app offers both dark and light themes; both are designed with proper contrast. In light theme, dark text on light background and vice versa in dark theme are all tuned for readability.
- We avoid using color alone to convey information. For instance, if the active model is indicated by a colored dot, we also include a text label or an icon with a label. Error messages are not only red but also accompanied by an error icon or the word "Error".

Focus Indicators: All interactive elements have a visible focus ring (using Tailwind’s focus styles, typically a 4px pink outline shadow as defined in our design tokens). This is important for keyboard users to know where they are on the page. We use CSS like focus:outline-none focus:ring-4 focus:ring-pink-400/40 on buttons and inputs, which provides a clear highlight.

Keyboard Navigation and Order: The layout is structured so that tab order is logical:
- On page load, focus is on the main chat input (so a user can start typing right away).
- Tabbing moves to the “Send” button (if present), then perhaps to model selector, then to thread list items, etc., in an order that makes sense (we ensure the HTML order of elements matches the desired focus order).
- We have also considered keyboard shortcuts for convenience (not in MVP, but planned): e.g., pressing Ctrl+K might focus the model switcher, or N could start a new chat. If implemented, those are documented in a help tooltip or in docs/ui/flows.md. Keyboard shortcuts are always optional enhancements (the UI remains fully usable without them).

Screen Reader Testing: We tested the interface with NVDA/JAWS (Windows) and VoiceOver (Mac) to ensure that:
- The screen reader announces entering the chat interface, the presence of the threads list and main region.
- It reads out the messages in order. With our role="log" setup, as new assistant messages stream in, VoiceOver and NVDA read them chunk by chunk after the user stops typing.
- The New Chat button is announced properly. Thread items in the sidebar are announced as clickable (we might mark them up as <button> or <a> elements with the thread title as their label). If a thread has no title (untitled new chat), it might be announced as “Untitled chat” or simply “New Chat” for clarity.
- The model selector announces the current selection and can be changed with standard combo box interactions. For example, when focused it might say "Model: GPT-4, collapsed, combo box" and upon activating, each option "GPT-3.5" or "Claude 2" is read as you arrow through.
- The message input is labeled (screen reader might say "Type a message, edit text, multiline").

ARIA Labels and Roles Recap:
- role="log" on message container with aria-live="polite" (implicit).
- role="alert" on error messages for immediate announcement.
- aria-label on icons (e.g., the paper plane send icon has aria-label or an accompanying visually hidden text "Send").
- aria-labelledby used where appropriate, such as linking the modal dialog title to the modal (if we had dialogs).
- The document title (<title>) updates to reflect the app state (we include the app name "bombay" and maybe the active thread title in the page title, so screen reader users can identify the page context).
- Landmarks (<header>, <nav>, <main>) are in use for structural navigation.

Live Region for Typing Indicator: When the assistant is thinking, we show a " Assistant is typing..." indicator. This is marked with aria-live="polite" as well, so screen readers get a heads-up. However, we don't spam announcements for every small update; typically we add the node once and remove it on completion, so it announces "Assistant is typing" one time.

Accessible Styling: We chose to use our design system’s focus and contrast guidelines to not only meet technical requirements but also to maintain a consistent aesthetic. For instance, our focus ring is a subtle pink glow that meets contrast needs against both dark and light backgrounds. We also ensure that any custom scrollbars or overflow areas are keyboard-accessible (we avoid situations where content is only scrollable by mouse – e.g., the thread list and chat log both scroll with keyboard arrow keys or PgUp/PgDn as they are plain divs/ul with overflow).

Testing with High Contrast & Zoom: We tried the interface in high-contrast mode (Windows) and with browser zoom up to 200%. The layout remains usable (thanks to responsive design and flex layouts). Text does not clip and buttons remain visible. The use of relative units (Tailwind spacing and font sizes) helps scale the UI. For screen magnifier users, our large default font (IBM Plex Mono) and spacing should already be beneficial.

ARIA practices references: Our approach was informed by WAI-ARIA Authoring Practices for chat applications and logs. In particular, using role="log" is recommended for chat transcripts to automatically handle live announcements in order. We followed these best practices to reduce custom scripting for announcements.

In summary, the application should be operable and readable for users with diverse needs. We will continue to test and iterate on accessibility. Any new UI feature will be evaluated for keyboard access and screen reader clarity. For example, if we introduce a modal (like a confirmation dialog), we will use aria-modal="true" and focus trapping, etc., per best practices. The current MVP UI (thread list, chat area, inputs, dropdown) has been built with accessibility in mind from the start.