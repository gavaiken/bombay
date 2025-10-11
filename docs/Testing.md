Testing Strategy

We employ a multi-layer testing strategy to ensure the application works correctly and regressions are caught. The main testing approaches are:

- Unit Tests (limited in MVP): small-scale tests for pure functions or utilities.
- Integration Tests for API routes and adapters: testing the API endpoints in isolation (with a test DB or mocks) to verify they return expected results given certain inputs.
- End-to-End (E2E) Tests for user flows: using a browser automation tool to simulate a user interacting with the app, ensuring all components work together (UI, API, database).

Given the nature of this project (full-stack with external API calls), our emphasis has been on integration and E2E tests, while unit tests are added for critical logic like context truncation.

1. Unit Tests

For self-contained logic, we use Jest (or a similar framework) for unit tests. Examples of what we’d unit test:
- The context window truncation function (ensuring it drops oldest messages correctly when token limits are exceeded).
- Utility functions, like formatting of model labels or parsing functions if any.

Each unit test file resides alongside the code or in a __tests__/ directory, following the naming convention *.test.ts. These tests do not require a database or network; they should run quickly. To run the unit test suite (if present), use npm test (or npm run test:unit if defined). In the current setup, we have minimal unit tests because much logic either hits the database or external APIs (which are covered by integration/E2E tests).

2. API Integration Tests

For the API routes and provider adapters, we ensure they behave correctly using integration tests:
- We simulate HTTP requests to our Next.js API endpoints and verify the responses (status codes and JSON structure). This can be done using Supertest or by invoking Next.js route handlers directly in a test environment.
- We use a test database (or SQLite in-memory) for these tests, so that creating a user/thread/message in the test doesn’t affect real data. Prisma can be pointed to a sqlite file for test runs.
- Sensitive external calls (OpenAI/Anthropic) are mocked in integration tests. We do not want to call actual AI APIs in automated tests (costly and non-deterministic). Instead, we provide stub implementations for the adapter interface. For example, we might have a “FakeAdapter” that implements chat() by returning a predefined sequence of strings (e.g., echoing the user input or a canned response). During tests, we inject this fake adapter in place of the real OpenAI/Anthropic adapters.

Key scenarios tested:
- Thread creation: calling POST /api/threads with a title yields a 200 and a new thread in the DB.
- Thread switching: calling PATCH /api/threads/:id changes the activeModel and returns the updated thread.
- Message sending (non-stream test): It’s tricky to fully simulate SSE in a test, but we can test the handler up to the point of calling the adapter. Using a fake adapter, we can collect the streamed output. We ensure that a new Message is created in the DB with the correct content and model when the stream finishes, and that an error in the adapter yields an error event.
- Auth required: we test that calling an endpoint without a session (or with an invalid session) returns 401 Unauthorized.

We can run these tests also via npm test (if integrated). They typically set up test data at the start (e.g., create a dummy user and session token) and tear it down after.

3. Mocking External Services for Testing

As noted, we avoid hitting real external services in tests. We use Mock Service Worker (MSW) for a lot of our testing needs, especially on the front-end side:
- In the development and test environment, MSW intercepts network calls to /api/* and can serve predefined responses from fixtures. This allows us to run the front-end without a real backend, and also to run end-to-end tests deterministically.
- For example, we have JSON fixture files in docs/ui/fixtures/ (like threads.json, messages.json) that contain sample data. During tests, the MSW is configured to intercept calls such as GET /api/threads and respond with the data from threads.json. Similarly for other endpoints.
- We also handle streaming in mocks: MSW can intercept the POST /api/messages and instead of a true SSE, we simulate a stream (sometimes using a mocked EventSource or by sending chunks in sequence).

By using the same fixtures and mock handlers, our tests can verify the UI rendering and flows without needing a running real server or hitting the live database.

The MSW setup is mainly for the front-end development and E2E tests. For API integration tests on the server, we might not use MSW, but rather stub functions or use dependency injection to supply fake adapter responses.

4. End-to-End Testing (Playwright)

For full end-to-end testing, we use Playwright (a browser automation tool) to simulate actual user behavior in a headless browser:
- We wrote Playwright tests that open a browser, navigate to the local dev app (usually started via npm run dev or a test-specific start), and perform actions: log in (for tests, we might stub the auth or use a test account), click “New Chat”, type a message, switch models, etc.
- To avoid dependence on external APIs, we run these E2E tests with MSW mocks enabled. That means the app is running, but every network call it makes is intercepted and served by our predefined fixtures. This way, the UI thinks it’s talking to a real server and models, but it’s getting predictable responses.

The E2E tests cover critical user journeys:
- Login flow: (In tests, we might bypass actual Google login by using a stub login method or setting a cookie if possible. Alternatively, run a local NextAuth in test mode with a dummy provider.)
- Viewing thread list: ensure the sidebar loads threads (from fixtures) and displays them.
- Starting a new chat: click “New Chat”, ensure a new thread appears in the list (the mock handler for POST /api/threads returns a new thread).
- Sending a message: type into the input and hit enter/send. The test verifies that a user message bubble appears immediately and an assistant typing indicator shows. Then the assistant response should stream in. The test waits for the final done state (we know from fixture what the assistant response will be) and then verifies the content is displayed.
- Switching model mid-thread: select a different model from the dropdown. The test verifies that a) the model label changes (UI feedback), and b) the next message uses the new model (in our mock, perhaps the response text or some indicator is different). We ensure the PATCH /api/threads/:id mock was called and the UI updated.
- Error handling: we simulate an error response from the backend (e.g., the mock for POST /api/messages can end with an error event). The test ensures an error message bubble is shown to the user.
- Thread persistence: ensure that if we reload the page (or re-run the app with the same fixtures), the threads and messages reappear, simulating persistence.

Playwright tests are run via npm run test:e2e. Our configuration launches a development server with mocks, then runs the test suite. We have included data-testid attributes on important UI elements (buttons, input, message bubbles, etc.) to make it easy for the tests to select them. The selectors used in tests correspond to those IDs (for example, data-testid="send-button", data-testid="model-select"). This decouples tests from CSS or text, making them less fragile. When we replaced the mocks with the real API (in staging or production), we rerun the E2E tests to ensure nothing broke. The tests were designed such that if the real API returns data similar to the fixtures (e.g., similar shapes), the interactions remain valid. We might adjust tests to accommodate slight differences (like exact wording of model names or error messages) when running against a live environment.

5. Manual Testing

In addition to automated tests, we performed manual testing:
- Different browsers (Chrome, Firefox, Safari) to verify the UI layout and behavior (especially since this is a user-facing app).
- Testing with slow network or offline (using browser dev tools to simulate) to ensure the loading states and streaming still function gracefully.
- Signing in/out multiple times, or using two accounts (to ensure data isolation).
- Trying edge cases: extremely long questions, special characters in input, switching models rapidly, etc., to see how the system copes.

Issues found during manual testing often lead to adding specific automated tests or hardening the code.

6. Running Tests in CI/CD

We plan to integrate these tests into continuous integration:
- Pull requests will trigger the unit/integration tests to run.
- We may run a subset of Playwright E2E tests in CI (possibly using headless browsers on a CI service, and using the mock mode or a test deployment).
- Ensuring tests pass before merge gives confidence that new changes haven’t broken core functionality.

7. Testing the AI Behavior

Because AI output can be non-deterministic, our approach is to decouple tests from exact reply contents:
- In integration tests of adapters, we don’t assert the exact text of a completion (since real models vary). Instead, we test structural things: that some data is streamed, that the done event arrives with a usage object, etc. For instance, using OpenAI with a known prompt like “1+1?” might consistently return “2”, but generally we avoid depending on the model for a correct answer in tests.
- In E2E tests with mocks, we can use exact text because our mock provides a fixed response. This is how we verify UI displays the assistant reply correctly (since the mock might send a known sentence).
- We also ensure the UI can handle changes in content length gracefully (like the auto-scroll continues to work as messages come in). Some of those are visually checked or asserted via Playwright (e.g., checking that the last message is scrolled into view after sending).

8. Summary

Our testing strategy aims to cover:
- The API contract: verified by integration tests (and by using the same mocks in UI tests to ensure front-end and back-end agree on shapes).
- The adapter functionality: tested by simulating provider responses.
- The end-user experience: tested by automated flows and manual testing.

By combining these, we catch issues early. For example, if a change in the database schema occurs, an integration test for an API route might fail (reminding us to update the handler). Or if a UI change breaks the selector, a Playwright test will flag it. As the project grows, we will add more unit tests for new logic and expand E2E tests for new features (like if we add thread renaming or export, we’d write tests for those too). The goal is a robust test suite that developers can run to validate their changes confidently.