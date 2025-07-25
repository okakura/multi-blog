---
applyTo: '**'
---

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

Use PNPM for package management, builds, and running the development server.
DO NOT use NPM or Yarn.

When you need to call 'cargo run' it's going to open a new terminal at the root of the project
so you need to chain 'cd api && cargo run' to run the backend server, or alternatively use the Makefile command `make dev-backend`.

1. **Project Structure**: Understand the folder structure and where different types of files are located (e.g., components, hooks, services). Use pnpm for package management, builds, and running the development server.

2. **Data Flow**: Be aware of how data flows through the application, including the use of context, props, and state management.

3. **API Integration**: Follow the established patterns for API calls, including error handling and loading states. Utilize SWR for data fetching and caching where appropriate.

4. **Styling**: Adhere to the project's styling guidelines, including the use of tailwind or other styling solutions.

5. **Testing**: Write tests for new features and ensure existing tests pass. Follow the testing strategy used in the project (e.g., unit tests, integration tests).

6. **Code Quality**: Maintain high code quality by following best practices, including code reviews, linting, and adhering to the project's coding standards.

7. **Documentation**: Update documentation as needed to reflect changes in the codebase or project structure.

8. **Collaboration**: Communicate effectively with team members and seek feedback on changes. Use version control (e.g., Git) to manage code changes.
