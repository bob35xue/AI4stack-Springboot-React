This project is a comprehensive full-stack AI chatbot application designed with a modern microservices
  architecture. The backend is built with Java 21 and Spring Boot 3.3.1, serving RESTful APIs for user
  management, product data, and issue classification. Its core AI capability is powered by the Deep Java
  Library (DJL) running a pre-trained DistilBERT model with a PyTorch engine, enabling real-time natural
  language classification of user queries. Data persistence is handled by Spring Data JPA with a SQLite
  database. The frontend is a dynamic single-page application developed with React 19, using React Router for
  navigation and Axios for seamless communication with the backend. The entire application is containerized
  using Docker and orchestrated with Docker Compose, ensuring a scalable and maintainable deployment. Key
  features include user authentication, session management, and an administrative dashboard for monitoring
  chatbot performance and retraining the AI model.