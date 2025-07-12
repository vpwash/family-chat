# Developer Specification for: family-chat

## 1. Foundational Understanding

**Objective:** To ensure a deep and thorough understanding of the project requirements before any code is written.

**Instructions for LLM:**

* **Acknowledge Base Project:** Recognize that a foundational React project with Material-UI is already in place. Your primary role is to build upon this existing structure.
* **Context7 MCP Research:** Before proceeding, conduct a comprehensive analysis of the project using the Context7 MCP framework. This involves a deep dive into the following seven areas:
    1.  **Core Functionality:** What is the primary purpose of this application? What problems does it solve for the user?
    2.  **User Personas:** Who are the target users? What are their technical skills and expectations?
    3.  **Data Models:** What data will the application manage? Define the structure and relationships of the data.
    4.  **User Flows:** Map out the step-by-step journeys that users will take through the application.
    5.  **UI/UX Design Principles:** What are the key design considerations? This includes layout, color schemes, typography, and accessibility.
    6.  **Technical Constraints:** Are there any specific technical limitations or requirements to consider (e.g., performance targets, browser compatibility)?
    7.  **Success Metrics:** How will the success of this project be measured?
* **Deep Thinking and Planning:** After completing the Context7 MCP research, synthesize the findings into a detailed development plan. This plan should outline the component hierarchy, state management strategy, and a phased implementation approach. Do not proceed to the coding phase until this plan is complete and has been reviewed.

## 2. Engineering Best Practices and Quality Assurance

This section outlines additional best practices that should be incorporated into the project.

* **Linting and Formatting:**
    * **Objective:** To maintain a consistent and high-quality codebase.
    * **Action:** Set up ESLint and Prettier with a recommended configuration for React and Material-UI.
* **Component Library:**
    * **Objective:** To promote code reuse and a consistent design system.
    * **Action:** Create a dedicated directory for reusable UI components.
* **State Management:**
    * **Objective:** To manage application state in a predictable and scalable manner.
    * **Action:** Based on the project's complexity, recommend and implement a suitable state management library (e.g., Redux Toolkit, Zustand).
* **Testing Framework:**
    * **Objective:** To ensure the reliability and correctness of the application.
    * **Action:** Configure a testing framework, such as Jest and React Testing Library, and establish a testing strategy.
* **Security:**
    * **Objective:** To build a secure and trustworthy application.
    * **Action:** Research and implement security best practices for React, including input validation, protection against XSS, and secure authentication/authorization patterns.
* **Performance:**
    * **Objective:** To deliver a fast and responsive user experience.
    * **Action:** Implement performance optimization techniques such as code-splitting, lazy loading, memoization, and image optimization. Analyze and address potential bottlenecks.
* **Accessibility (a11y):**
    * **Objective:** To ensure the application is usable by people with disabilities.
    * **Action:** Adhere to WCAG 2.1 AA standards. Ensure all components are keyboard navigable, have proper ARIA roles, and maintain sufficient color contrast.
* **Documentation:**
    * **Objective:** To create clear and maintainable code.
    * **Action:** Generate comprehensive JSDoc comments for all components, detailing their purpose, props, and usage examples. Maintain an up-to-date README with setup and deployment instructions.

