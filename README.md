## 1. System Overview

The project is a sophisticated customer query classification system designed to intelligently handle user inquiries by leveraging machine learning.

The application is architected as a modern, containerized web service, comprising:

*   A **React frontend** providing a dynamic and responsive user interface for both standard users and administrators.
*   A **Spring Boot backend** serving a RESTful API, managing business logic, data persistence, and machine learning model inference.
*   An integrated **DistilBERT model** for Natural Language Processing (NLP), which classifies user-submitted issues against a predefined product catalog.
*   A **SQLite database** for lightweight and persistent data storage.
*   A **Dockerized environment** for consistent development, deployment, and scaling.

The core functionality allows users to log in and submit text-based queries. The backend classifies these queries, associates them with a specific product, and stores the interaction. An admin dashboard provides tools for reviewing queries, managing low-confidence classifications, and triggering model retraining.

## 2. Technology Stack

  ┌───────────┬─────────────────────────┬───────────┬──────────────────────────────────────────┐
  │ Component │ Technology/Library      │ Version   │ Purpose                                  │
  ├───────────┼─────────────────────────┼───────────┼──────────────────────────────────────────┤
  │ Backend   │ Java                    │ 21        │ Core programming language                │
  │           │ Spring Boot             │ 3.5.4     │ Application framework                    │
  │           │ Spring Web              │           │ Building RESTful APIs                    │
  │           │ Spring Data JPA         │           │ Data access and persistence              │
  │           │ Hibernate               │           │ ORM implementation                       │
  │           │ Deep Java Library (DJL) │ 0.33.0    │ Machine Learning model integration       │
  │           │ PyTorch Engine          │           │ DJL backend for running the ML model     │
  │           │ Maven                   │           │ Build automation & dependency management │
  │ Frontend  │ React                   │ 19.0.0    │ UI library                               │
  │           │ React Router            │ 7.0.2     │ Client-side routing                      │
  │           │ Axios                   │ 1.7.9     │ HTTP client for API communication        │
  │           │ Node.js                 │ 22-alpine │ Runtime and build environment            │
  │ Database  │ SQLite                  │           │ File-based SQL database                  │
  │           │ Xerial SQLite JDBC      │           │ JDBC driver for Java connectivity        │
  │ DevOps    │ Docker & Docker Compose │           │ Containerization and orchestration       │
  └───────────┴─────────────────────────┴───────────┴──────────────────────────────────────────┘


## 3. System Architecture

The application follows a classic client-server architecture, containerized for portability and scalability.

```
+----------------+      +------------------------+      +---------------------+
| Client Browser |----->|  Frontend Container    |----->|  Backend Container  |
| (React App)    |      |  (Node.js/serve)       |      |  (Spring Boot/JVM)  |
+----------------+      +------------------------+      +----------+----------+
                            |  (Port 3000)           |             |
                            |                        |             |
                            +----- Docker Network ---+             |
                                                                   |
                                     +-----------------------------+
                                     |
                                     v
                         +-----------------------+      +--------------------+
                         | IssueClassifierService|----->|   DistilBERT Model |
                         | (DJL / PyTorch)       |      | (.pt & vocab.txt)  |
                         +-----------------------+      +--------------------+
                                     |
                                     v
                         +-----------------------+      +--------------------+
                         | Spring Data JPA Repos |----->|   SQLite Database  |
                         | (Hibernate)           |      |   (db4chatbot.db)  |
                         +-----------------------+      +--------------------+
```

### Data Flow

1.  A user interacts with the React UI in their browser.
2.  The React app sends HTTP requests (e.g., login, submit query) to the backend via the exposed port (3000 -> 8000).
3.  The Spring Boot backend receives the request. The `WebConfig` class handles CORS to allow cross-origin requests from the frontend.
4.  For a classification request, the `IssueController` calls the `IssueClassifierService`.
5.  The service uses DJL to run the user's query through the pre-loaded DistilBERT model.
6.  The model returns a classification result (product name and confidence score).
7.  The backend saves the `Issue` entity, including the query, user info, and classification result, to the SQLite database via Spring Data JPA.
8.  A response is sent back to the React frontend, which updates the UI to show the chatbot's reply.

## 4. Project Structure

The repository is a monorepo containing two primary sub-projects: `backend4c` and `frontend4c`.

```
Chatbot4stack-Springboot-React/
├── backend/
│   ├── pom.xml                 # Maven configuration, lists all backend dependencies
│   ├── Dockerfile              # Defines the backend container image
│   ├── src/main/java/
│   │   └── com/example/chatbot/
│   │       ├── ChatbotApplication.java # Main Spring Boot entry point
│   │       ├── config/             # WebConfig for CORS
│   │       ├── controller/         # REST API controllers (User, Product, Issue)
│   │       ├── model/              # JPA data entities (User, Product, Issue)
│   │       ├── repository/         # Spring Data JPA repositories
│   │       └── service/            # Business logic (DataInitializer, IssueClassifierService)
│   └── src/main/resources/
│       ├── application.properties  # Spring Boot configuration (DB, etc.)
│       ├── logback-spring.xml    # Logging configuration
│       ├── model/model_distill_bert.pt # The ML model file
│       └── vocab.txt             # Vocabulary for the ML model tokenizer
├── frontend/
│   ├── package.json            # NPM configuration, lists all frontend dependencies
│   ├── Dockerfile              # Defines the frontend container image (multi-stage build)
│   ├── src/
│   │   ├── App.js              # Main component with routing logic
│   │   ├── api.js              # Centralized Axios instance for API calls
│   │   ├── components/         # Reusable React components (e.g., ChatHistory)
│   │   └── pages/              # Page-level components (Login, Chatbot, AdminDashboard)
│   └── public/
└── docker-compose.yml          # Orchestrates the multi-container application
```

## 5. Backend Details (`backend`)

### 5.1. API Endpoints


  ┌─────────────┬─────┬─────────────┬──────────────────────────────────────────────────────┬─────────────┐
  │ Controller  │ Met │ Path        │ Description                                          │ Session ... │
  ├─────────────┼─────┼─────────────┼──────────────────────────────────────────────────────┼─────────────┤
  │ `UserCon... │ `PO │ `/users/... │ Authenticates a user. On success, sets a userId i... │ No          │
  │             │ GET │ /users      │ Retrieves a list of all users.                       │ Yes         │
  │ `Product... │ GET │ /products   │ Retrieves the list of all predefined products.       │ Yes         │
  │ `IssueCo... │ `PO │ `/issues... │ Classifies a user query, creates an Issue record,... │ Yes         │
  └─────────────┴─────┴─────────────┴──────────────────────────────────────────────────────┴─────────────┘

### 5.2. Machine Learning Service (`IssueClassifierService`)

This service is the core of the AI functionality.
*   **Model Loading**: On application startup, the service loads the DistilBERT model (`model_distill_bert.pt`) and its associated vocabulary (`vocab.txt`) from the classpath resources. It uses DJL's `Criteria` API to configure the model with the PyTorch engine.
*   **Translator (`MyTranslator`)**: This crucial class bridges the gap between raw Java types and the tensor data the model expects.
    *   `processInput`: Takes a `String` query, converts it to lowercase, and uses a `BertTokenizer` to create token indices and an attention mask. These are converted into `NDArray` tensors for the model.
    *   `processOutput`: Takes the model's output `NDList`, applies a softmax function to get probabilities, and maps these to the list of product names, returning a `Classifications` object.
*   **Classification**: The `classify` method orchestrates the prediction, logging the query and the best classification result.

### 5.3. Data Persistence

*   **Database**: A file-based SQLite database is used. The path is configured in `application.properties` relative to the application's runtime directory: `jdbc:sqlite:./app/data4c/db/db4chatbot.db`.
*   **Schema Management**: `spring.jpa.hibernate.ddl-auto=update` automatically updates the database schema to match the JPA entities (`User`, `Product`, `Issue`).
*   **Data Initialization**: The `DataInitializer` component runs on startup (`@PostConstruct`) and populates the `products` table with a predefined list if it's empty, ensuring the classifier has known labels.

### 5.4. Configuration

*   **`application.properties`**: Defines the database connection, JPA dialect, and exposes the `/health` and `/info` actuator endpoints for monitoring.
*   **`WebConfig.java`**: Configures CORS to allow requests from `http://localhost:3000`, enabling the React frontend to communicate with the API. It allows credentials to support session management.
*   **`logback-spring.xml`**: Sets up logging to both the console and a rolling file appender located in `app/data4c/logs/`.

## 6. Frontend Details (`frontend`)

### 6.1. Application Structure and Routing

*   **`App.js`**: The root component that sets up routing using `react-router-dom`. It maintains the `currentUser` state, which is persisted in `localStorage`.
*   **Protected Routes**: The `/chatbot` and `/adminDashboard` routes are protected. They check for a valid `currentUser` in state; if none exists, the user is redirected to `/login`. The admin route has an additional check for the `is_superuser` flag.

### 6.2. State Management and API Communication

*   **API Client**: `src/api.js` exports a pre-configured `axios` instance. It sets the `baseURL` to `http://localhost:8080` and enables `withCredentials: true` to ensure the session cookie (`JSESSIONID`) is sent with every request, maintaining the user's session.
*   **State**: Component state is managed locally using `useState` and `useEffect` hooks. User authentication state is shared via props and persisted in `localStorage`.

### 6.3. Key Pages

*   **`LoginPage.js`**: A simple form that sends the user's email and password to the `/users/login` endpoint. On success, it updates the application's user state and navigates to the appropriate page based on the user's role.
*   **`ChatbotPage.js`**: The main interface for non-admin users. It features a message input form and a display area for the conversation history. It sends new queries to the `/issues/classify` endpoint.
*   **`AdminDashboardPage.js`**: A powerful interface for administrators. It fetches data from the `/issues`, `/users`, and `/products` endpoints. It provides features to:
    *   View and filter all customer issues.
    *   Separately view "unknown queries" (those with low confidence scores).
    *   Manually resolve unknown queries by assigning a correct product category.
    *   Trigger a model retraining process (via a call to `/issues/retrain`).

## 7. Setup and Deployment

### 7.1. Local Development

1.  **Backend**: Navigate to `backend` and run `mvn spring-boot:run`. The server will start on port 8080.
2.  **Frontend**: Navigate to `frontend`, run `npm install` to install dependencies, then `npm start` to launch the development server on port 3000.

### 7.2. Docker Deployment

The `docker-compose.yml` file provides a one-command setup for the entire application.

*   **Build**: `docker-compose build` will build the images for both the frontend and backend as defined in their respective `Dockerfile`s.
*   **Run**: `docker-compose up` will start both containers.
    *   The backend is exposed on port 8000.
    *   The frontend is exposed on port 3000.
    *   A named volume (`data4c`) is used to persist the SQLite database and logs outside the container lifecycle.
    *   A `healthcheck` is configured for the backend. The `depends_on` condition in the frontend service ensures it only starts after the backend is healthy and ready to accept connections.
