# ComplaintBox — Hostel Maintenance Complaint Tracker

A complete, full-stack Spring Boot web application designed for student hostel management. Replaces verbal and lost complaints with automated ticket tracking, technician assignment, status lifecycle progression (`OPEN` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`), and auto-flagging of overdue complaints (>5 days).

---

## 🚀 Features

- **Complaint Lifecycle Management**: Track maintenance issues from creation to resolution.
- **Workflow Business Rules**: 
  - Status progression sequence: `OPEN` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`.
  - Moving status backward requires an explanatory remark (enforced at service level).
  - Automatic timestamping for `createdAt`, `updatedAt`, and `resolvedAt`.
- **Auto-flag Overdue Issues**: Visual pulsing badge and dedicated filter for unresolved tickets open longer than 5 days.
- **Resident Directory**: Manage hostel residents, room allocations, emails, and phone numbers.
- **Staff & Technician Roster**: Track assigned plumbers, electricians, cleaners, and wardens.
- **Categorization**: Group issues under Plumbing, Electrical, Carpentry, Housekeeping, etc.
- **Interactive UI**: Clean, responsive Vanilla JS + CSS dashboard with modal forms, toast notifications, search, and status filter pills.
- **Swagger OpenAPI**: Live interactive API documentation at `/swagger-ui/index.html`.

---

## 🛠️ Tech Stack

- **Backend**: Spring Boot 4.1.1, Spring Data JPA, Spring WebMVC, Hibernate ORM 7.x
- **Language**: Java 17
- **Database**: MySQL 8.x
- **Build Tool**: Maven 3.9+
- **Frontend**: Vanilla JavaScript, HTML5, CSS3, Tabler Icons, Google Fonts
- **Documentation**: SpringDoc OpenAPI 3.1.0

---

## 📋 API Endpoints

### Complaints (`/api/complaints`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/complaints` | Log a new maintenance complaint |
| `GET` | `/api/complaints` | Get all complaints |
| `GET` | `/api/complaints/{id}` | Get complaint by ID |
| `PUT` | `/api/complaints/{id}` | Update complaint (status, staff, remarks) |
| `DELETE` | `/api/complaints/{id}` | Delete complaint |
| `GET` | `/api/complaints/search?keyword=` | Search description case-insensitively |
| `GET` | `/api/complaints/resident/{id}` | Get complaints by resident |
| `GET` | `/api/complaints/status/{status}` | Filter complaints by status |

### Residents (`/api/residents`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` / `GET` / `PUT` / `DELETE` | `/api/residents` | Full CRUD for hostel residents |
| `GET` | `/api/residents/search?keyword=` | Search residents by name |

### Staff (`/api/staff`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` / `GET` / `PUT` / `DELETE` | `/api/staff` | Full CRUD for maintenance staff |
| `GET` | `/api/staff/search?keyword=` | Search staff by name |

### Categories (`/api/categories`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` / `GET` / `PUT` / `DELETE` | `/api/categories` | Full CRUD for issue categories |
| `GET` | `/api/categories/search?keyword=` | Search categories by name |

---

## ⚙️ How to Run Locally

### Prerequisites
- Java 17 or higher
- MySQL Server 8.0 running on port 3306

### 1. Database Setup
Ensure MySQL is running. In `src/main/resources/application.properties`, update your credentials if needed:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/hotel_complaint_box?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

### 2. Build & Run
```bash
# Using Maven Wrapper
./mvnw clean package -DskipTests
java -jar target/complaintbox-0.0.1-SNAPSHOT.jar
```

### 3. Access Web App
- **UI Dashboard**: [http://localhost:8080/](http://localhost:8080/)
- **Swagger API Docs**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
