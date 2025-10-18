# Scopes Feature – UX Design Document

## **Overview**

The **Scopes** feature allows users to control which personal data sources (or contexts) the AI can draw from during a conversation. Each **Scope** represents a category of user data (e.g. Work, Health, Finance). Users can easily see which scopes are active, toggle them on/off in real time, and get transparency when personal data is used in answers. This design integrates Scopes into the existing Bombay Chat UI on both web and mobile, focusing on core interactions and states.

## **UX Goals**

- **Privacy Transparency:** Clearly indicate when and from which scope personal data is used in a response (e.g. a “Recalled from: [Scope]” note) so users know how their data is being leveraged.
- **Lightweight Control:** Provide a simple, unobtrusive way (toggle buttons) to turn each scope on or off at any time, without leaving or disrupting the chat.
- **Real-Time Recall Adjustment:** Scope toggles take effect immediately for upcoming messages, enabling users to adjust the AI’s access to data in mid-conversation and see the impact in real time.
- **Zero-Data Assurance:** When no scopes are active, the interface should reassure the user that the assistant is using **no personal data**, reinforcing trust through transparency.

## **Desktop Web Interface Design**

On desktop, the Scopes UI is integrated into the main chat panel, just below the chat header. The left sidebar (thread list) remains unchanged. The main panel layout is extended to include a **Scope Toggle Bar** at the top of the conversation, where users can view and toggle scopes. Active scopes are visibly highlighted (e.g. with a filled background or bold text), while inactive scopes appear unfilled or dimmed. A short status text may appear when no scopes are active to indicate “personal data disabled.”

**Desktop Layout with Scope Toggles and Annotations:**

```
+-----------------------------------------------------+
| Chat Title: Bombay AI (GPT-4)                      |
|-----------------------------------------------------|
| Scopes: [Work] [Health] [Finance]                  | <-- Scope toggle bar (chips for each data scope)
| (All scopes active in this example)                | <-- when inactive, chips appear unfilled or dimmed
|-----------------------------------------------------|
| **User:** What did I log today?                    |  <-- user message in chat
| **Assistant:**                                      |
|   Recalled from: Work 🛈                            |  <-- scope annotation indicating source of recall
|   You noted **"Meeting at 2 PM"** in your Work log. |  <-- assistant answer with recalled content
|                                                    |
| **User:** Great, what about my steps?              |  <-- user message (follow-up question)
| **Assistant:**                                      |
|   Recalled from: Health 🛈                          |  <-- annotation for content from Health scope
|   You walked **5,000 steps** today (from Health app). |
|                                                     |
| ... (conversation continues) ...                    |
|-----------------------------------------------------|
| [ Type your message... ]            ( Send )        |  <-- message input field and send button
+-----------------------------------------------------+

```

In the **Scope Toggle Bar** (second line of the header area), each scope is represented as a button or “chip” (e.g. **`[Work]`**, **`[Health]`**, **`[Finance]`**). Clicking a scope toggles its state: when **ON**, the chip is highlighted (e.g. solid background); when **OFF**, it’s shown in a neutral style (e.g. outline or gray text). In the example above, all three scopes are active. If, say, **Health** were turned off, the bar might display it as an unfilled button (**`[Health]`** in plain outline) while others remain highlighted.

Below the scope bar, the chat conversation proceeds as usual. **Scope Annotations** appear within assistant messages whenever personal data is referenced. The annotation format is a small prefix line or inline badge (e.g. *“Recalled from: Work 🛈”*) indicating the scope source. This line provides transparency by explicitly citing the data origin. The 🛈 info icon can be hovered or clicked to show more detail (such as the data snippet or timestamp) if needed, though by default it just acts as a visual indicator. The assistant’s message then includes the recalled information (often in quotes or bold to distinguish it) blended into the answer.

The message input at the bottom remains unchanged, but its behavior is influenced by scopes: the user can ask questions normally, and the system will include/exclude personal context based on the current scope toggles.

**Zero-Scopes State (Desktop):** If the user disables all scopes, the interface reflects that no personal data will be used. For example, the scope bar will show all scopes in the OFF state, and a short note might be displayed:

```
Scopes: [Work] [Health] [Finance]    <-- all toggles shown, currently OFF
(No scopes active – personal data not in use)   <-- zero-scopes indicator text

```

In this state, assistant answers will rely only on general knowledge (with **no “Recalled from…”** annotations). This zero-scope indicator text is usually a subtle gray note beneath the scope toggles to reassure the user that the AI is *not* using any private data. The note disappears once at least one scope is toggled on.

## **Mobile Interface Design**

On mobile devices, the Scopes feature is presented in a compact, responsive manner. The functionality is the same, but the layout adjusts to a single-column view with limited width:

- The **chat header** on mobile shows the thread title (and model, if applicable) on the top bar, often with a menu button for the sidebar. The scope toggles are placed just below the header or as part of the header in a scrollable row.
- If the device width is too narrow to show all scope chips in one line, the scope bar becomes horizontally scrollable or wraps onto a second line. Tapping and swiping allow access to additional scopes. Each chip still indicates on/off state by highlighting.
- The conversation messages and annotations flow in a single column. The info icon and text remain legible at smaller sizes (possibly using icons and shorter labels if needed).

**Mobile Chat UI with Scopes (Example):**

```
+------------------------------+
| Chat: Bombay AI (GPT-4)      |
| [Threads☰]        [Scopes🔳] |   <-- Top bar: thread menu and possibly a scopes menu icon
|------------------------------|
| Scopes: [Work] [Health] [Fin]|   <-- Scope toggle bar (scrollable chips)
| (Work & Health ON, Fin OFF)  |   <-- example state: Finance off (dimmed)
|------------------------------|
| User: What did I log today?  |
| Assistant:                   |
|   Recalled from: Work 🛈      |   <-- annotation shown in smaller font
|   (Mentions "Meeting at 2 PM") |
|                              |
| User: What about my steps?   |
| Assistant:                   |
|   Recalled from: Health 🛈    |
|   (Mentions 5,000 steps)      |
| ...                          |
|------------------------------|
| [ Type a message... ] (Send) |
+------------------------------+

```

In the mobile example above, the **Scope Toggle Bar** is placed below the header. Three scope chips are shown, with “Fin” (Finance) as a shortened label due to space (it’s currently off/dim). The chips could also be represented by icons if available, but text abbreviations keep it clear. The user can swipe this bar horizontally if more scopes exist beyond the screen width. Alternatively, a **`[Scopes🔳]`** button in the header could open a dropdown with toggles, but the design leans toward showing the scopes openly for transparency.

Tapping a scope chip on mobile immediately toggles it on or off, just like clicking on desktop. The chat view updates to reflect the change (for example, if all scopes turned off, the “(No scopes active)” note would appear). The assistant’s responses on mobile include the same **“Recalled from: [Scope] 🛈”** line for transparency, likely in a slightly smaller or italicized text above the message bubble. The info icon 🛈 is touch-friendly; tapping it could pop up a small overlay with more detail if needed (though detailed help popups are beyond this core scope).

The **Zero-Scopes state** on mobile similarly shows all scope chips off. The scope bar might show a placeholder message or simply rely on the dimmed chips and possibly a note like “No personal data in use” below the chips. The user is clearly informed when personal data is completely excluded.

## **Core Interactions & States**

- **Viewing Active Scopes:** At any point, the user can glance at the Scope toggle bar to see which scopes are active. Active scopes are visually distinct (highlighted color or a filled button style). This persistent visibility ensures the user is always aware of what personal data categories are in play.
- **Toggling Scopes On/Off:** The user can click/tap on a scope chip to toggle it. **Turning a scope ON** will immediately include that category’s data in subsequent assistant answers (the system might fetch relevant info from that scope next time it’s needed). **Turning a scope OFF** excludes that data source moving forward. The UI gives instant feedback by changing the chip’s appearance (e.g. highlighting it or graying it out) as soon as it’s toggled. There is no extra confirmation dialog — toggling is meant to be lightweight and instant. However, for clarity, a brief toast or subtle text change could confirm the change (e.g. showing “Work scope enabled✅” for a second, though this may be optional).
- **Mid-Chat Scope Changes:** Scopes can be changed **in the middle of a conversation** without restarting or leaving the chat. For example, a user might start with all scopes off, ask a general question, then toggle on the “Work” scope and ask a question that draws on work data. The system will adjust in real time: the next assistant answer will use the newly enabled scope. If a scope is toggled while an answer is being formulated (e.g. during streaming), the current answer won’t retroactively include that data, but the change will take effect for the next user prompt. This dynamic control allows on-the-fly adjustments to what context the AI has. The UI remains stable during a mid-chat toggle – only the chip style updates. Users can continue typing or reading without interruption.
- **Scope Source Annotations:** Whenever the assistant’s answer includes information from a user’s scope (personal data), a **source annotation** is shown. This typically appears as a prefix line in the message bubble: *“Recalled from: [Scope Name] 🛈”*. This text is slightly lighter or smaller to distinguish it from the main answer. It provides transparency, letting the user know exactly which category of their data was used for that content. If multiple scopes contribute, the assistant could list multiple annotations (e.g. “Recalled from: Work and Health”), or annotate each piece of info separately. The 🛈 icon reinforces that this is an informational note. (In this design, clicking the icon could show a snippet of the source or an explanation, but designing that detail is not required in this core flow.)
- **Zero-Scopes (No Data) State:** If no scopes are active (either because the user turned them all off or perhaps just signed in and hasn’t enabled any), the UI clearly reflects a *zero-scopes state*. All scope chips are unhighlighted, and a brief placeholder note like *“No personal data sources active”* may be displayed in the scope bar area. This assures the user that the assistant is currently **not drawing on any personal data**. In this state, the assistant will only use general knowledge to answer questions. The user can still ask anything, but if they ask something that would normally require personal data (e.g. “What did I log today?”), the assistant might respond that it has no access to that information unless a scope is enabled. (The design does not introduce a modal or error here; the conversation itself naturally reveals the limitation, possibly with the assistant’s answer.) The zero-scopes UI state is essentially a **privacy-safe default**. It nudges the user to turn on a scope if they want more personalized answers, without popping up any intrusive alert. As soon as the user enables one or more scopes, the placeholder note disappears and annotations will resume as relevant.

## **Conclusion**

The ASCII mockups above illustrate how the Scopes feature is woven into Bombay Chat’s interface. The design maintains the familiar chat layout while adding a clear **Scope Toggle Bar** and inline annotations to achieve privacy transparency and user control. Whether on a desktop web browser or a mobile screen, users can effortlessly toggle their data scopes in real time, see which data sources are being used, and adjust the assistant’s recall on the fly. This empowers users with a sense of control over personal data usage, all within a lightweight UI element that keeps the focus on the conversation.