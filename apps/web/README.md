# Next.js Project: LearnHouse

This document serves as a comprehensive guide to setting up, running, and debugging the Next.js portion of the LearnHouse project. It covers the essential installation steps, configuration, and troubleshooting tips.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Running the Project](#running-the-project)
5. [Debugging with VSCode](#debugging-with-vscode)
6. [Troubleshooting](#troubleshooting)
7. [Additional Resources](#additional-resources)

---

## Project Overview

The Next.js application serves as the frontend for the LearnHouse project. It is responsible for rendering the user interface, fetching data from the backend API, and managing client-side interactivity.

---

## Requirements

Ensure you have the following installed:

- **Node.js** (version 16+ recommended)
- **pnpm** (version 8+)
- **VSCode** (with the Node.js and Debugger extensions)
- **TurboRepo** for managing monorepos (optional but recommended)

---

## Installation

Follow these steps to install the necessary dependencies and set up the project:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/learnhouse.git
   ```

2. Navigate to the `apps/web` directory:

   ```bash
   cd learnhouse/apps/web
   ```

3. Install dependencies using `pnpm`:

   ```bash
   pnpm install
   ```

4. Verify that all dependencies are correctly installed:
   ```bash
   pnpm list
   ```

---

## Running the Project

To run the Next.js application locally:

1. Start the development server:

   ```bash
   pnpm dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Debugging with VSCode

To debug the Next.js application in VSCode:

1. Open the `launch.json` file (usually located in the `.vscode` directory).

2. Add the following configuration for debugging Next.js:

   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "name": "Next.js: Debug",
         "runtimeExecutable": "npm",
         "runtimeArgs": ["run", "dev"],
         "port": 9229,
         "console": "integratedTerminal",
         "skipFiles": ["<node_internals>/**"]
       }
     ]
   }
   ```

3. Start debugging by selecting **Next.js: Debug** from the debug dropdown in VSCode and hitting the play button.

---

## Troubleshooting

### Common Issues

1. **Error: TurboRepo Workspace Issue**

   - **Solution:** Ensure the root `package.json` includes the proper `workspaces` configuration.

2. **Port Conflict**

   - **Solution:** If port 3000 is in use, change the port by updating the `package.json` script:
     ```json
     "scripts": {
       "dev": "next dev -p 4000"
     }
     ```

3. **Missing Dependencies**

   - **Solution:** Run `pnpm install` to install missing dependencies.

4. **Debugger Not Working**
   - **Solution:** Ensure the correct `runtimeExecutable` is set to `npm` and `runtimeArgs` include `run dev`.

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TurboRepo Documentation](https://turbo.build/repo/docs)
- [VSCode Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)

---

This README provides all the necessary details to set up and debug the Next.js portion of the LearnHouse project. If you encounter issues, consult the troubleshooting section or the additional resources linked above.
