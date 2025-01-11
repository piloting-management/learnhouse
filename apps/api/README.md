# FastAPI Project: LearnHouse API

This document provides detailed instructions for setting up, running, and debugging the FastAPI backend for the LearnHouse project. It includes installation steps, environment configuration, and helpful troubleshooting tips.

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

The FastAPI application serves as the backend for the LearnHouse project. It is responsible for managing data, handling API requests, and interacting with the database.

---

## Requirements

Ensure you have the following installed:

- **Python** (version 3.10+ recommended)
- **Poetry** (for dependency management)
- **VSCode** (with Python and Debugger extensions)

---

## Installation

Follow these steps to set up the backend project:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/learnhouse.git
   ```

2. Navigate to the `apps/api` directory:

   ```bash
   cd learnhouse/apps/api
   ```

3. Create and activate a virtual environment:

   ```bash
   python3 -m venv env
   source env/bin/activate  # For Mac/Linux
   env\Scripts\activate   # For Windows
   ```

4. Install dependencies using `poetry`:

   ```bash
   poetry install
   ```

   This command will install all the necessary libraries and create a `.venv` directory for the virtual environment.

5. Verify the installation:
   ```bash
   poetry show
   ```

---

## Running the Project

To start the FastAPI server locally:

1. Ensure the virtual environment is activated:

   ```bash
   source env/bin/activate  # For Mac/Linux
   env\Scripts\activate   # For Windows
   ```

2. Run the server using `uvicorn`:

   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 9000
   ```

3. Access the API documentation:
   - Swagger UI: [http://localhost:9000/docs](http://localhost:9000/docs)
   - Redoc: [http://localhost:9000/redoc](http://localhost:9000/redoc)

---

## Debugging with VSCode

To debug the FastAPI application in VSCode:

1. Open the `launch.json` file (usually located in the `.vscode` directory).

2. Add the following configuration for debugging FastAPI:

   ```json
   {
     "type": "python",
     "request": "launch",
     "name": "Python: FastAPI",
     "module": "uvicorn",
     "args": ["app:app", "--reload", "--host", "0.0.0.0", "--port", "9000"],
     "pythonPath": "${workspaceFolder}/apps/api/env/bin/python",
     "cwd": "${workspaceFolder}/apps/api",
     "env": {
       "PYTHONPATH": "${workspaceFolder}/apps/api"
     }
   }
   ```

3. Start debugging by selecting **Python: FastAPI** from the debug dropdown in VSCode and hitting the play button.

---

## Troubleshooting

### Common Issues

1. **Error: `ModuleNotFoundError`**

   - **Cause:** The Python environment is not correctly configured.
   - **Solution:** Ensure the correct virtual environment is activated and the `PYTHONPATH` is properly set in the `launch.json` file.

2. **Port Conflict**

   - **Solution:** Change the port in the `uvicorn` command:
     ```bash
     uvicorn app:app --reload --host 0.0.0.0 --port 8000
     ```

3. **Dependency Issues**

   - **Solution:** Reinstall dependencies:
     ```bash
     poetry install
     ```

4. **Debugger Not Working**
   - **Solution:** Verify that the correct `pythonPath` is set in the `launch.json` file and matches the virtual environment path.

---

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [VSCode Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)

---

This README provides all the necessary details to set up and debug the FastAPI portion of the LearnHouse project. If you encounter issues, consult the troubleshooting section or the additional resources linked above.
