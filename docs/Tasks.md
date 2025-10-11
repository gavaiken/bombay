# Tasks

Below is a sequential list of all tasks required to go from an empty project directory to a complete product. Each task is bite-sized with clear acceptance criteria that can be verified (often by running commands or tests). The development will pause after each task for review before proceeding.

## AI Agent Configuration

- [x]  **Create AGENTS.md**: Create a new `docs/AGENTS.md` file with instructions for the Claude AI agent. Include references to the Product Requirements Document (`docs/PRD.md`) and the Design document (`docs/Design.md`). Also outline that the agent should take the next incomplete task from `docs/Tasks.md`, implement it, then pause for human verification before continuing.

    **Acceptance Criteria:**

    - `docs/AGENTS.md` exists and contains references to `docs/PRD.md` and `docs/Design.md`.
    - The content explains the agent’s workflow (sequentially executing tasks from the task list and pausing for review).
    - (Verification: Opening `docs/AGENTS.md` shows the expected instructions, including the PRD/Design paths and task execution guidelines.)
    - _Confirmation:_ `docs/AGENTS.md` captures the source-of-truth references and operating loop, so this task is complete.
- [x]  **Symlink CLAUDE.md to AGENTS.md**: Create a symlink `CLAUDE.md` in the project root that points to `docs/AGENTS.md`. This ensures Claude Code reads the agent instructions.
    
    **Acceptance Criteria:**
    
    - A file `CLAUDE.md` exists in the root and is a symlink to `docs/AGENTS.md`.
    - `readlink CLAUDE.md` outputs `docs/AGENTS.md`, confirming the symlink target.
    - Opening `CLAUDE.md` shows the same content as `docs/AGENTS.md` (verifying the link is correct).
    - _Confirmation:_ `CLAUDE.md → docs/AGENTS.md` symlink created and verified via `readlink`.

## Development Environment Setup

- [ ]  **Verify Homebrew Installation**: Ensure Homebrew is installed and update it to the latest version. This will guarantee we have access to package management for any needed tools.
    
    **Acceptance Criteria:**
    
    - Running `brew --version` outputs the Homebrew version (confirming Homebrew is installed).
    - Running `brew update` completes without errors (Homebrew is up-to-date).
    - (Verification: `brew --version` returns a version string and `brew update` reports “Already up-to-date” or updates formulae successfully.)
- [ ]  **Verify Node.js Installation**: Ensure Node.js (and npm) is installed at a recent version, updating if necessary. Node will be used for front-end development and build tools.
    
    **Acceptance Criteria:**
    
    - Running `node -v` outputs a Node.js version (ideally LTS, e.g. v18.x or higher).
    - Running `npm -v` outputs the npm version, confirming npm is functional.
    - If Node was outdated, it has been upgraded (e.g. via Homebrew) to a current LTS release.
    - (Verification: `node -v` and `npm -v` show expected version numbers, and Node commands execute without error.)
- [ ]  **Verify Python Installation**: Ensure Python 3 is installed and updated to a modern version (e.g. Python 3.10+). This will be used for back-end development.
    
    **Acceptance Criteria:**
    
    - Running `python3 --version` outputs a Python 3.x version (at least 3.10 or later).
    - The Python installation is functional (e.g., running `python3 -c "print('OK')"` prints “OK”).
    - If the default Python was outdated, it has been updated (via Homebrew or pyenv) to a recent stable release.
    - (Verification: `python3 --version` shows a recent version number, indicating an up-to-date Python interpreter.)

## Version Control Setup

- [ ]  **Initialize Git Repository**: Set up a new git repository in the project directory to track our progress. This will allow version control and integration with GitHub.
    
    **Acceptance Criteria:**
    
    - The command `git init` has been run in `~/Source/bombay`, creating a `.git/` directory.
    - Running `git status` in the project shows “No commits yet” or an empty commit history (confirming the repo is initialized).
    - (Verification: The `.git` folder exists and `git status` outputs the expected initial repository state.)
- [ ]  **Create .gitignore**: Add a `.gitignore` file to exclude unnecessary or sensitive files from version control. It should cover common Node and Python artifacts.
    
    **Acceptance Criteria:**
    
    - A file `.gitignore` exists in the project root.
    - `.gitignore` contains entries for Node modules (e.g. `node_modules/`), Python bytecode and cache files (`.pyc`, `__pycache__/`), virtual environments (e.g. `venv/`), and OS files (like `.DS_Store`).
    - (Verification: Viewing `.gitignore` shows patterns for Node and Python ignores; for example, searching the file for “node_modules” and “**pycache**” returns entries.)
- [ ]  **Initial Commit**: Commit the existing documentation files to git. This includes the PRD, Design doc, Tasks list (this file), the new AGENTS guide, and .gitignore. Use a clear commit message (e.g. "Initial documentation commit").
    
    **Acceptance Criteria:**
    
    - `git add` has staged `docs/PRD.md`, `docs/Design.md`, `docs/Tasks.md`, `docs/AGENTS.md` (and the symlink `CLAUDE.md`), as well as `.gitignore`, and a commit is created.
    - Running `git log -1 --oneline` shows the initial commit with an appropriate message.
    - `git ls-files` lists the above files, confirming they are tracked in the repository.
    - (Verification: `git status` now shows a clean working directory, and `git log` indicates the initial commit containing the documentation files.)
- [ ]  **Create GitHub Repository**: Create a new repository on GitHub (e.g., named "bombay") for this project and prepare it for remote collaboration. This can be done via GitHub CLI or the web interface.
    
    **Acceptance Criteria:**
    
    - A remote repository exists on GitHub (accessible by the user) with the given project name.
    - (If using GitHub CLI: Running `gh repo view <your-username>/bombay` shows repository details, confirming creation.)
    - (Verification: The GitHub repo URL is reachable or visible in the GitHub account, and it’s empty or only contains an initial README if created with one.)
- [ ]  **Add Remote and Push**: Link the local git repo to the GitHub repository and push the initial commit to the remote.
    
    **Acceptance Criteria:**
    
    - The command `git remote add origin <repo-url>` has been run with the correct GitHub repository URL.
    - Running `git remote -v` shows the `origin` remote pointing to the GitHub repo.
    - The initial commit is pushed to the `main` (or `master`) branch on GitHub (`git push -u origin main` completes successfully).
    - (Verification: `git branch -vv` shows the local main branch tracking `origin/main`. Viewing the GitHub repo online shows the documentation files and initial commit.)

## Project Scaffolding

- [ ]  **Initialize Frontend Application**: Set up the front-end project using React (Node.js). Create a new React app (for example, via Create React App or a similar tool) in a `frontend` directory. Use TypeScript if possible for maintainability.
    
    **Acceptance Criteria:**
    
    - A new React project is created under `frontend/` (it contains `package.json`, a `/src` directory, etc.).
    - The app builds and runs without errors. For example, running `npm run build` inside the `frontend` directory completes successfully, producing a `build/` folder with the compiled assets.
    - (Verification: The presence of `frontend/src/index.js` or `index.tsx`, and a successful build process. The build output (e.g., `frontend/build/index.html`) exists, indicating the scaffolded app compiled correctly.)
- [ ]  **Initialize Backend Application**: Set up the back-end project using Python. Create a new directory (e.g. `backend`) and a basic Python application (using a framework like **FastAPI**) that can run a web server. Implement a simple endpoint (e.g., GET `/` returning "Hello, World") to validate the setup.
    
    **Acceptance Criteria:**
    
    - A Python project is created under `backend/` with a main application file (e.g. `backend/main.py`) that defines a web server (using FastAPI or Flask).
    - Running the development server (for FastAPI, e.g. `uvicorn backend.main:app --port 8000`) starts without errors.
    - Hitting the root endpoint (e.g., `GET http://localhost:8000/`) returns a response "Hello, World!" (or the specified test message).
    - (Verification: Starting the server and curling `http://127.0.0.1:8000/` returns the expected greeting. Alternatively, using FastAPI’s TestClient to get `/` returns status 200 and "Hello, World!" in the body.)
- [ ]  **Set Up Testing Frameworks**: Configure testing for both backend and frontend to enable automated verification of features. For Python, set up **pytest**. For the React app, ensure **Jest** (or the built-in test runner) is configured. Create a simple dummy test in each to verify the setup.
    
    **Acceptance Criteria:**
    
    - **Backend**: `pytest` is added to the project (and to requirements if applicable), and a sample test (e.g., always passing or a test that `GET /` returns 200) is written. Running `pytest` yields 0 failures.
    - **Frontend**: The React app’s test runner (Jest) is configured (this is usually default with Create React App). A sample test (for example, checking that the main App component renders without crashing) is present. Running `npm test` (in CI mode or once-off) passes all tests.
    - (Verification: Execute `pytest` in the backend folder – it should report success. Execute `npm test -- --watchAll=false` in the frontend – it should run the tests and report passing results.)
- [ ]  **Set Up Database**: Introduce a database for persistence. Use SQLite for simplicity (no external service needed). Configure the backend to use SQLite (e.g., a file `backend/tasks.db`) and create a schema for the core data (e.g., a "tasks" table).
    
    **Acceptance Criteria:**
    
    - A SQLite database file (e.g., `tasks.db`) is initialized (either manually checked in or created on first run).
    - A "tasks" table exists in the database with appropriate columns as per the design (e.g., `id` integer primary key, `title` text, `description` text, `completed` boolean/int).
    - The backend application is set up to connect to this database (for example, using an ORM or direct `sqlite3` connections) and will create the table if it doesn’t exist.
    - (Verification: After running the app (or a setup script), the `backend/tasks.db` file exists. Querying the SQLite schema (e.g., using `sqlite3 tasks.db ".tables"` or checking via a short Python snippet) shows a "tasks" table present with the defined columns.)

## Feature Implementation

### Backend API Features

- [ ]  **Implement Create Task API**: Develop an endpoint to create a new task. According to the PRD, a task has attributes like title (and optionally description). This will be a POST request to the backend (e.g., `POST /tasks`) that inserts a new task into the database.
    
    **Acceptance Criteria:**
    
    - **Endpoint Behavior**: `POST /tasks` accepts task data (JSON payload, e.g., `{ "title": "...", "description": "..." }`) and creates a new task record in the database.
    - On success, the endpoint returns a 201 Created status and the created task object (including its auto-generated `id` and default `completed` status, e.g., false).
    - The new task actually persists in the database (verified by a subsequent read or direct DB query).
    - (Verification: Starting the backend server and sending a sample POST request with a title/description returns a 201 status and a JSON response containing the new task with an ID. After the request, querying the DB or using the GET endpoint (if implemented) shows the new task present.)
- [ ]  **Implement List Tasks API**: Develop an endpoint to retrieve all tasks. This will be a GET request (e.g., `GET /tasks`) that reads tasks from the database and returns them in a list.
    
    **Acceptance Criteria:**
    
    - **Endpoint Behavior**: `GET /tasks` returns a 200 OK status and a JSON array of task objects. If no tasks exist, it returns an empty list `[]`.
    - Each task object in the list includes at least `id`, `title`, `description`, and `completed` status (and any other fields defined in the design).
    - The tasks are fetched from the SQLite database and reflect the current state (including any tasks added or modified).
    - (Verification: After creating some tasks (via the API or seeding the DB), a GET request to `/tasks` returns a list containing those tasks. For example, if one task was created in the previous step, it appears in the array with correct data.)
- [ ]  **Implement Update Task API**: Develop an endpoint to update an existing task’s details or status. This could be a PUT/PATCH request (e.g., `PUT /tasks/{id}`) that updates a task’s title, description, or completion status.
    
    **Acceptance Criteria:**
    
    - **Endpoint Behavior**: `PUT /tasks/{id}` (or PATCH) accepts JSON with fields to update (e.g., title or completed flag) and updates the corresponding task in the database.
    - On success, returns 200 OK and the updated task data. The database record is modified accordingly (e.g., marking a task as completed or changing its title).
    - If the task ID does not exist, the endpoint returns an appropriate error (404 Not Found).
    - (Verification: Create a test task, then send `PUT /tasks/{id}` with new data (e.g., change the title or set `"completed": true`). The response should be 200 and show the task with updated fields. A subsequent GET for that task (or all tasks) shows the updated data. Also, trying to update a non-existent ID yields a 404 error.)
- [ ]  **Implement Delete Task API**: Develop an endpoint to delete a task. This will handle DELETE requests (e.g., `DELETE /tasks/{id}`) and remove the task from the database.
    
    **Acceptance Criteria:**
    
    - **Endpoint Behavior**: `DELETE /tasks/{id}` removes the task with the given ID from the database.
    - On success, returns a 204 No Content (or 200 with no body) indicating the task was deleted. The task should no longer exist in the database after this operation.
    - If the task ID does not exist, the endpoint returns a 404 Not Found error.
    - (Verification: Create a sample task, then send `DELETE /tasks/{id}` for that task. The response should indicate success (no content). A follow-up GET `/tasks/{id}` (if implemented) or GET all tasks should confirm the task is gone. Also, deleting an already deleted or non-existent task returns a 404.)

### Frontend UI Features

- [ ]  **Display Tasks List (UI)**: Implement a front-end component/page that displays the list of tasks. On page load, the app should fetch the list of tasks from the backend and render them in a readable format.
    
    **Acceptance Criteria:**
    
    - The frontend has a "Tasks" page or component that on load sends a request to `GET /tasks` on the backend API.
    - If tasks exist, they are displayed as a list (e.g., each task’s title (and possibly description) is shown in a list or table).
    - If no tasks exist, the UI shows an empty state message (e.g. “No tasks yet”).
    - (Verification: With the backend running and containing some tasks, open the front-end application. The tasks page should show the tasks that were created. In code, verify that an API call to `/tasks` is made (e.g., using the browser dev tools or reading the source code for a fetch/XHR request). No console errors should occur during rendering.)
- [ ]  **Add Task (UI)**: Implement a form in the frontend to create a new task. This should allow the user to input at least a title (and description, if applicable) and submit to add the task via the API.
    
    **Acceptance Criteria:**
    
    - There is an input form on the UI for adding a new task (e.g., text fields for title/description and a submit button labeled "Add Task").
    - When the form is submitted, the frontend makes a `POST /tasks` API call with the form data.
    - If the API call succeeds, the new task is added to the list displayed on the page (without requiring a full page refresh). The list updates to include the newly created task.
    - Basic validation: The form prevents submission of an empty title (if title is required by PRD). If an error occurs (e.g., API failure), an error message is shown to the user.
    - (Verification: Using the running app, fill out the "Add Task" form and submit. The new task appears in the task list immediately. In the network dev tools, a successful POST request is seen. Also, confirming via a GET /tasks (or the UI list itself) that the task now exists. No errors appear in console upon submission.)
- [ ]  **Mark Task as Complete (UI)**: Add functionality to mark a task as completed (or toggle its completed status) from the UI. For example, each task in the list could have a checkbox or "Complete" button. When used, it will update the task’s status via the API and update the UI accordingly.
    
    **Acceptance Criteria:**
    
    - Each task item in the list has a way to mark it complete/incomplete (e.g., a checkbox or toggle button reflecting the `completed` status).
    - When the user marks a task as complete, the frontend sends a `PUT /tasks/{id}` request to update that task’s `completed` status to true (or false if unchecking).
    - On success, the task’s display is updated in the UI without a full refresh (e.g., the task might show a strikethrough or a "Done" label). The change is persisted (refreshing the page would show the task in its new state, since the backend was updated).
    - Completed tasks are visually distinguished from incomplete ones (for example, gray text or strikethrough for completed tasks, as per design guidelines).
    - (Verification: In the running app, clicking the complete checkbox/button on a task triggers an API call (observable in network logs) which returns success. The UI immediately reflects the completed state (e.g., the task appears crossed out). If the page is refreshed or tasks re-fetched, the task remains marked as completed. No console errors occur during this interaction.)
- [ ]  **Delete Task (UI)**: Provide a way to delete a task from the UI. Each task entry should have a delete option (e.g., a trash icon or "Delete" button). When clicked, it should ask for confirmation and then call the delete API.
    
    **Acceptance Criteria:**
    
    - Each task in the list has a delete control (button/icon).
    - Clicking the delete initiates a confirmation prompt (to prevent accidental deletions). The user can confirm or cancel.
    - On confirm, the frontend sends a `DELETE /tasks/{id}` request to the backend for that task.
    - If the API responds with success, the task is removed from the UI list immediately.
    - The deletion persists (the task is truly gone from backend; a refresh will not show it).
    - (Verification: In the app, use the delete button on a task. Confirm the prompt, and observe a `DELETE` request in the network logs. The UI list no longer shows the task. Checking the backend (via GET /tasks or database) confirms the task is removed. Canceling the prompt should leave the task unchanged. No errors should occur during deletion operations.)

## Testing and Finalization

- [ ]  **Integration Testing**: Write automated tests to cover the end-to-end functionality of the core features (task creation, listing, updating, deletion). These tests ensure that the backend and database work together as expected. *(Note: Frontend functionality can be tested separately or manually, but here we focus on backend integration tests.)*
    
    **Acceptance Criteria:**
    
    - A test suite (e.g., additional pytest test functions) is implemented to simulate a full workflow: creating tasks, retrieving list of tasks, updating a task, and deleting a task.
    - The tests cover normal cases (e.g., create and then read to verify data) and edge cases (e.g., updating or deleting a non-existent task returns correct error).
    - The tests use the actual API endpoints (possibly via FastAPI’s TestClient or making HTTP calls to a test instance of the server) to closely mimic real usage.
    - Running `pytest` executes all integration tests and they all pass.
    - (Verification: When running the test suite now, all tests pass indicating that the create/list/update/delete operations function correctly in sequence. For example, a test might create 2 tasks, assert the list endpoint returns them, update one, assert the change, then delete and assert it’s removed. All assertions should succeed.)
- [ ]  **Code Quality Check (Linting & Formatting)**: Ensure the codebase adheres to styling and quality standards for both Python and JavaScript code. This involves running linters/formatters and making any necessary adjustments.
    
    **Acceptance Criteria:**
    
    - Python code is formatted (e.g., using **black** or **autopep8**) and linted (using **flake8/pylint**) with no major warnings or errors. The code conforms to PEP8 style guidelines.
    - JavaScript/TypeScript code is formatted (e.g., with **Prettier**) and linted (using **ESLint**) with no errors. All unused variables, etc., are cleaned up.
    - No extraneous debug statements or commented-out blocks remain; the code is clean and production-ready.
    - (Verification: Running formatting tools (e.g., `black .` for Python, `prettier --check .` for JS) results in no needed changes. Running linters (`flake8` and `eslint`) yields 0 errors. The repository shows consistent code style. Reviewing the code manually finds it well-organized and readable.)
- [ ]  **Documentation and Final Review**: Prepare final documentation and review the project for completion. Create or update the `README.md` file to provide an overview and usage instructions. Perform a final run-through of the application to ensure everything works as expected.
    
    **Acceptance Criteria:**
    
    - A `README.md` exists (or is updated) at the project root with clear documentation. It includes:
        - **Project Overview**: A brief description of what the product is and does.
        - **Prerequisites**: What needs to be installed (Node, Python, etc.) and any setup steps (e.g., installing dependencies with `npm install` and `pip install`).
        - **Installation & Setup**: Instructions to set up the development environment, how to initialize the database (if not auto-created), etc.
        - **Running the Application**: How to start the backend server and the frontend development server, including any necessary environment variables or configuration.
        - **Usage**: How to use the application once running (e.g., how to access the web UI, basic operations like adding a task).
        - **Testing**: How to run the test suites for both backend and frontend.
        - **Project Structure** (optional): Overview of the directories and key files (frontend, backend, docs, etc.).
    - The documentation is written clearly and covers all the steps to get the product running from scratch.
    - Final manual test: Start the backend and frontend following the README instructions and perform a quick end-to-end check (create a task via the UI, mark it complete, delete it) to ensure the application behaves as expected in a real scenario.
    - (Verification: Opening `README.md` shows all the required sections (Installation, Usage, etc.) with appropriate content. Following the instructions in the README allows a new developer/user to set up and run the project successfully. The product features work in a final end-to-end manual test, confirming the project is complete.)

## UI Specification Implementation

### LLM-Friendly Mock Setup

- [ ]  **Create UI Specification Structure**: Set up the complete `docs/ui/` folder structure with all machine-readable specifications that Claude Code can use to build the chat interface deterministically.
    
    **Acceptance Criteria:**
    
    - `docs/ui/` directory exists with design tokens, component specs, fixtures, and wireframes
    - `docs/ui/tokens.json` contains color, font, spacing, and other design tokens
    - `docs/ui/components.md` defines component inventory and structure
    - `docs/ui/selectors.md` specifies canonical `data-testid` selectors for testing
    - `docs/ui/states.md` documents component states and behaviors
    - `docs/ui/fixtures/` contains JSON mock data (models.json, threads.json, messages.json, user.json)
    - `docs/ui/wireframes/chat.html` provides copy-ready HTML structure with proper selectors
    - `docs/ui/flows.md` documents user interaction flows and keyboard shortcuts
    - `docs/ui/acceptance.md` defines testable acceptance criteria
    - (Verification: All files exist with comprehensive content. Claude Code can read the specifications and understand the complete UI requirements without ambiguity.)

### Brand System Setup

- [ ]  **Add Brand Tokens**: Update design tokens with bombay brand palette, IBM Plex Mono font, and new design system.
    
    **Acceptance Criteria:**
    
    - `docs/ui/tokens.json` contains bombay brand colors (dark and light themes)
    - Font definition uses IBM Plex Mono as primary font
    - Brand colors include: brand-600 (#E11D74), brand-500 (#FF2E88), brand-300 (#FFA6D1), brand-100 (#FFE4F0)
    - Radius values use 12px (md) and 16px (xl) for bombay's shape language
    - Gradient and elevation tokens include pink-tinted shadows
    - (Verification: JSON file contains keys: `font.mono`, `color.dark.bg`, `color.light.bg`, `gradient.brand` with correct bombay values.)

- [ ]  **Configure Tailwind & CSS Variables**: Set up Tailwind configuration and CSS custom properties for theme switching.
    
    **Acceptance Criteria:**
    
    - `tailwind.config.ts` extends theme with brand color variables and IBM Plex Mono font
    - `app/globals.css` defines CSS variables for dark/light themes with bombay colors
    - Dark theme set as default with `data-theme="dark"` on body
    - CSS variables follow pattern: `--color-bg`, `--color-brand-500`, etc.
    - Custom scrollbar styling with brand accent colors
    - (Verification: Playwright check: `document.body.getAttribute('data-theme') === 'dark'`; CSS var `--color-bg` equals `#0B1220`.)

- [ ]  **Add IBM Plex Mono Font**: Integrate IBM Plex Mono via Google Fonts in Next.js layout.
    
    **Acceptance Criteria:**
    
    - IBM Plex Mono loaded in `app/layout.tsx` with weights 400, 500, 600, 700
    - Font variable `--font-mono` properly configured
    - Body element uses `font-mono` class
    - Font loads with swap display for performance
    - (Verification: Computed `font-family` on `body` contains "IBM Plex Mono".)

- [ ]  **Add Brand Assets**: Create wordmark SVG and favicon with bombay branding.
    
    **Acceptance Criteria:**
    
    - `public/brand/wordmark.svg` contains bombay wordmark with gradient and caret bar
    - `public/favicon.svg` contains monogram-style 'b' in brand colors
    - Favicon properly referenced in layout metadata
    - SVG assets use proper gradient definitions and dark background
    - (Verification: `GET /favicon.svg` returns 200; `<link rel="icon">` present in HTML.)

- [ ]  **Create Brand Guidelines**: Document brand usage rules and component recipes for consistent implementation.
    
    **Acceptance Criteria:**
    
    - `docs/brand.md` contains comprehensive brand guidelines
    - Guidelines specify lowercase "bombay" usage and IBM Plex Mono requirement
    - Tailwind component recipes provided for buttons, panels, and form elements
    - Color accessibility notes and contrast requirements documented
    - Theme implementation details and CSS variable structure explained
    - (Verification: File exists; contains "Always use lowercase" and component recipes.)

- [ ]  **Validate Brand Implementation**: Add brand-specific acceptance tests and verify consistent application.
    
    **Acceptance Criteria:**
    
    - Brand validation tests added to `docs/ui/acceptance.md` (B1-B5)
    - Tests verify IBM Plex Mono font loading and application
    - Tests check CSS custom properties and theme variables
    - Brand gradient and color accessibility validated
    - Favicon and metadata properly configured
    - (Verification: Acceptance criteria B1-B5 added; tests can verify font, colors, and assets.)

- [ ]  **Implement Mock Service Worker (MSW) Setup**: Configure MSW in the Next.js application to serve fixture data and enable UI development before backend exists.
    
    **Acceptance Criteria:**
    
    - MSW is installed and configured in the Next.js project
    - Mock handlers serve data from `docs/ui/fixtures/` files
    - API endpoints match the defined contract: `GET /api/threads`, `GET /api/messages?threadId=...`, `PATCH /api/threads/:id`, `POST /api/messages`
    - Mock responses include proper HTTP status codes and realistic delays
    - Development server works with mocks (no real backend required)
    - (Verification: Frontend runs with `npm run dev`, makes API calls that return fixture data. Network tab shows mocked responses. UI displays sample conversations from fixtures.)

- [ ]  **Add Playwright End-to-End Testing**: Set up Playwright with the basic acceptance test suite to verify UI functionality against the specification.
    
    **Acceptance Criteria:**
    
    - Playwright is installed and configured in the project
    - `e2e/ui.spec.ts` implements the acceptance checks from `docs/ui/acceptance.md`
    - Tests use the canonical selectors from `docs/ui/selectors.md`
    - Test covers: shell rendering, fixture data loading, thread switching, model selection, message sending flow
    - `npm run test:e2e` executes tests against running dev server with mocks
    - All acceptance tests pass, confirming UI meets specification
    - (Verification: Running `npx playwright test` shows all tests passing. Tests successfully locate elements using data-testid selectors and verify expected behaviors.)

### Chat UI Implementation

- [ ]  **Build Chat Interface from Wireframe**: Implement the complete chat UI using the HTML wireframe and design tokens, ensuring all required selectors are present.
    
    **Acceptance Criteria:**
    
    - Chat interface matches the structure from `docs/ui/wireframes/chat.html`
    - All components use design tokens from `docs/ui/tokens.json`
    - Every interactive element has the correct `data-testid` from `docs/ui/selectors.md`
    - Layout is responsive (mobile overlay, desktop sidebar)
    - Visual design uses Tailwind CSS with proper styling
    - Components are properly structured (ThreadTray, ChatPane, Composer, etc.)
    - (Verification: UI renders without errors, visually matches wireframe intent, all acceptance test selectors are found, responsive design works on different screen sizes.)

- [ ]  **Implement State Management and Interactions**: Add React state management and user interactions to make the UI fully functional with mock data.
    
    **Acceptance Criteria:**
    
    - Thread selection switches active conversation and loads messages
    - Model switcher updates thread settings and applies to future messages
    - Message composer handles input, validation, and sending
    - Typing indicators appear during simulated assistant responses
    - Loading and error states display properly
    - Keyboard shortcuts work (Cmd+N for new thread, Enter to send, etc.)
    - All user flows from `docs/ui/flows.md` function correctly
    - (Verification: All Playwright acceptance tests pass. User can interact with every feature. State persists correctly when switching threads. No console errors during normal usage.)

- [ ]  **Add Real-time Message Streaming**: Implement streaming responses for assistant messages to simulate the real chat experience.
    
    **Acceptance Criteria:**
    
    - Assistant messages stream in progressively (not all at once)
    - Typing indicator shows during streaming, disappears when complete
    - User cannot send messages while assistant is responding
    - Streaming works with mock WebSocket or Server-Sent Events
    - Auto-scroll keeps latest content visible during streaming
    - Stream can be cancelled if user navigates away
    - (Verification: Sending a message shows typing indicator, then assistant response appears word-by-word. UI remains responsive during streaming. All streaming edge cases handled gracefully.)

### Progressive Enhancement

- [ ]  **Replace Mocks with Real API Integration**: Swap MSW mocks for actual backend API calls while keeping all selectors and UI behavior unchanged.
    
    **Acceptance Criteria:**
    
    - API client configured to call real backend endpoints
    - Authentication and error handling implemented
    - WebSocket connection for real-time message streaming
    - Mock responses are replaced but UI behavior stays identical
    - All Playwright tests continue passing with real backend
    - Graceful fallback if backend is unavailable
    - (Verification: UI works with real API, all features functional, no behavior changes from user perspective. Tests pass against real backend. Error states handle API failures appropriately.)

- [ ]  **Performance Optimization and Polish**: Optimize the chat interface for production use with proper loading states, caching, and performance improvements.
    
    **Acceptance Criteria:**
    
    - Message history pagination for long conversations
    - Optimistic updates for better perceived performance
    - Proper loading skeletons and transitions
    - Image/media handling in messages (if applicable)
    - Accessibility improvements (ARIA labels, keyboard navigation)
    - Bundle size optimization and code splitting
    - Service worker for offline functionality (optional)
    - (Verification: Lighthouse scores 90+ for Performance, Accessibility, Best Practices. Large conversations load smoothly. App feels responsive under normal usage patterns.)

## Production Deployment

### API Keys and External Services

- [ ]  **Generate AI Provider API Keys**: Request user to create API keys for OpenAI and Anthropic services.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Sign up for OpenAI account at https://platform.openai.com
      - Generate API key with appropriate usage limits
      - Sign up for Anthropic account at https://console.anthropic.com  
      - Generate API key for Claude access
      - Store keys securely for environment variable configuration
    - Agent waits for user confirmation that keys have been generated
    - Keys follow format: `sk-...` for OpenAI, `sk-ant-...` for Anthropic
    - (Verification: User confirms API keys are generated and ready for deployment setup.)

### Hosting Platform Setup

- [ ]  **Set Up Vercel Account and Project**: Request user to create Vercel account and connect GitHub repository.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Sign up for Vercel account at https://vercel.com
      - Connect GitHub account and authorize Vercel access
      - Import the bombay GitHub repository as new Vercel project
      - Configure project settings (Next.js framework auto-detected)
      - Set Node.js version to 18+ in project settings
    - Agent waits for user confirmation that Vercel project is created
    - Initial deployment should succeed (may have missing env vars)
    - (Verification: User confirms Vercel project exists and initial deployment completed.)

- [ ]  **Configure Production Environment Variables**: Set up API keys and database connection in Vercel dashboard.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Access Vercel project dashboard → Settings → Environment Variables
      - Add production environment variables:
        - `OPENAI_API_KEY` (from previous step)
        - `ANTHROPIC_API_KEY` (from previous step)
        - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (OAuth setup)
        - `NEXTAUTH_SECRET` (generate random 32+ char string)
        - `DATABASE_URL` (managed Postgres connection string)
        - `NEXTAUTH_URL` (https://bombay.chat)
      - Trigger new deployment after environment variables are set
    - All environment variables properly configured for production
    - New deployment succeeds with all services connected
    - (Verification: Environment variables configured, deployment succeeds, app functional on Vercel domain.)

### Domain Configuration

- [ ]  **Configure Custom Domain**: Set up bombay.chat domain to point to Vercel deployment.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Access Vercel project dashboard → Settings → Domains
      - Add custom domain: bombay.chat
      - Copy DNS configuration values from Vercel (CNAME/A records)
      - Log into Porkbun account at https://porkbun.com
      - Navigate to DNS management for bombay.chat domain
      - Update DNS records to point to Vercel (remove default parking)
      - Wait for DNS propagation (5-60 minutes)
    - SSL certificate automatically provisioned by Vercel
    - Domain resolves to bombay application
    - HTTPS redirect properly configured
    - (Verification: https://bombay.chat loads the application with valid SSL certificate.)

### Database Setup

- [ ]  **Set Up Production Database**: Configure managed Postgres database for production use.
    
    **Acceptance Criteria:**
    
    - **USER ACTION REQUIRED**: Agent prompts user to:
      - Choose managed Postgres provider (Neon/Supabase/Vercel Postgres)
      - Create production database instance
      - Configure connection settings (SSL required)
      - Copy database connection string
      - Add `DATABASE_URL` to Vercel environment variables
      - Run Prisma migrations: `npx prisma db push` (or setup auto-migration)
    - Database schema matches development (users, threads, messages tables)
    - Connection secure with SSL/TLS encryption
    - Prisma can successfully connect and query database
    - (Verification: Database connected, tables created, application can read/write data in production.)

### Production Validation

- [ ]  **Test End-to-End Production Flow**: Validate complete application functionality on live domain.
    
    **Acceptance Criteria:**
    
    - Navigate to https://bombay.chat and verify application loads
    - Test Google OAuth sign-in flow works in production
    - Create new chat thread and verify database persistence
    - Send message and verify AI provider integration (OpenAI/Anthropic)
    - Test model switching mid-conversation
    - Verify message history persists across sessions
    - Check SSL certificate validity and security headers
    - Test responsive design on mobile and desktop
    - Verify no console errors or broken functionality
    - (Verification: All core features work correctly on production domain with real user flow.)

### Local Development Setup

- [ ]  **Document Local Development Process**: Create clear instructions for running bombay locally.
    
    **Acceptance Criteria:**
    
    - Update README.md with local development section:
      - Prerequisites: Node.js 18+, PostgreSQL (local or remote)
      - Clone repository and install dependencies: `npm install`
      - Set up `.env.local` with development environment variables
      - Initialize database: `npx prisma db push`
      - Start development server: `npm run dev`
      - Access local app at http://localhost:3000
    - Include troubleshooting section for common issues
    - Document how to switch between local and production databases
    - Provide example `.env.local` template with placeholder values
    - (Verification: Following README instructions results in working local development environment.)
