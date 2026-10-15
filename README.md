# ✈️ Flight Management System

A comprehensive flight booking and management system built with Spring Boot and React, featuring complete user authentication, flight booking, payment integration, and admin management capabilities.

## 🚀 **Features**

### **User Features**
- 🔐 **Secure Authentication**: JWT-based login/registration with email verification
- 🔍 **Flight Search**: Advanced search by source, destination, and date
- 📋 **Flight Booking**: Complete booking flow with passenger details
- 💳 **Payment Integration**: Razorpay payment gateway with multiple payment options
- 📧 **Email Notifications**: Automated booking confirmations and verification emails
- 👤 **User Dashboard**: Personal dashboard with booking history and statistics
- 📱 **Responsive Design**: Mobile-friendly interface with modern UI/UX

### **Admin Features**
- 🎯 **Admin Dashboard**: Comprehensive statistics and management interface
- ✈️ **Flight Management**: Add, edit, and delete flights
- 👥 **User Management**: View and manage registered users
- 📊 **Booking Management**: Monitor and manage all bookings
- 💰 **Revenue Tracking**: Complete financial overview and analytics
- 🔧 **System Administration**: Full system control and configuration

## 🛠️ **Technology Stack**

The repository keeps application code in separate top-level `frontend/`,
`backend/`, and `database/` folders. Maven builds the frontend from `frontend/`
and copies its static output into the Spring Boot application.

```text
frontend/   React JavaScript application and Selenium browser tests
backend/    Spring Boot API and Maven build
database/   SQL schema
k8s/        Kubernetes deployment and service manifests
```

### **Backend**
- **Framework**: Spring Boot 3.5.13
- **Language**: Java 17
- **Database**: MySQL 8.0
- **Security**: Spring Security with JWT
- **Build Tool**: Maven
- **Email**: Spring Mail with Gmail SMTP

### **Frontend**
- **Framework**: React 19.2.5
- **Language**: JavaScript (ES6+) with React JSX
- **Routing**: React Router DOM 7.14.1
- **HTTP Client**: Axios 1.15.0
- **Styling**: CSS3 with modern design patterns

### **Payment & Integration**
- **Payment Gateway**: Razorpay
- **Authentication**: JWT + OAuth2 (Google)
- **Email Service**: Gmail SMTP
- **Database ORM**: Hibernate/JPA

## 📋 **Prerequisites**

- **Java 17** or higher
- **Node.js 18** or higher
- **MySQL 8.0** or higher
- **Maven 3.8** or higher
- **Git** for version control

## 🚀 **Quick Start**

### **1. Database Setup**
```sql
-- Create database
CREATE DATABASE flight_management;

-- Import schema from
database/update_schema.sql
```

### **2. Environment Configuration**
Set these variables in your shell, IDE run configuration, or deployment secret
manager (`.env` files are not loaded automatically by Spring Boot):
```env
# Database Configuration
DB_URL=jdbc:mysql://localhost:3306/flight_management
DB_USERNAME=root
DB_PASSWORD=<your database password>

# JWT Configuration
JWT_SECRET=<generate a unique random secret with at least 32 characters>
JWT_EXPIRATION=86400000

# Admin Credentials
ADMIN_EMAIL=admin@flyhigh.com
ADMIN_PASSWORD=<set a unique strong password>
```

Optional live integrations must also be supplied through environment
variables: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
`MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS_ENABLE`, `RAZORPAY_KEY_ID`, and
`RAZORPAY_KEY_SECRET`. Configure Google OAuth credentials with
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` only when enabling that
integration. The local Compose stack routes email to MailHog and the booking
demo skips live payment processing.

Never commit real credentials. Rotate any credentials that were previously
committed or shared, even if the commit has not been pushed.

### **3. Run Application**
```bash
# Navigate to backend directory
cd "Flight Management system/backend"

# Configure DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET (32+ characters),
# and ADMIN_PASSWORD in the current shell or IDE run configuration first.
mvn spring-boot:run
```

### **4. Access Application**
- **Main Application**: http://localhost:8085
- **Admin Dashboard**: http://localhost:8085/admin
- **API Documentation**: http://localhost:8085/swagger-ui.html

## 🔐 **Admin Account**

The bootstrap admin account is created or synchronized at startup from
`ADMIN_EMAIL` and `ADMIN_PASSWORD`. Set both through your shell, IDE run
configuration, or deployment secret manager. The password must be at least 12
characters; the configured password replaces the stored bootstrap admin
password at startup. There is no default admin password.

### **User Registration**
- Register new users through the signup page
- Email verification required for account activation

## 📊 **Database Schema**

### **Tables**
- **users**: User accounts and authentication
- **flights**: Flight information and schedules
- **bookings**: Booking records and details
- **passengers**: Passenger information
- **admin**: Admin account management

### **Key Relationships**
- Users → Bookings (One-to-Many)
- Flights → Bookings (One-to-Many)
- Bookings → Passengers (One-to-One)

## 🎯 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Email verification

### **Flights**
- `GET /api/flights` - Get all flights
- `GET /api/flights/{id}` - Get flight by ID
- `POST /api/flights` - Add flight (Admin only)
- `PUT /api/flights/{id}` - Update flight (Admin only)
- `DELETE /api/flights/{id}` - Delete flight (Admin only)

### **Bookings**
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/{userId}` - Get user bookings
- `GET /api/bookings` - Get all bookings (Admin only)

### **Payments**
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

## 💳 **Payment Integration**

### **Razorpay Configuration**
- **Test Mode**: Enabled by default
- **Key ID**: rzp_test_SeL5tzDCHelgYG
- **Supported Methods**: 
  - Credit/Debit Cards
  - UPI (QR Code)
  - Net Banking
  - Wallets

### **Payment Flow**
1. User selects flight and enters details
2. Redirected to payment page
3. Razorpay order created
4. Payment processed
5. Booking confirmed
6. Email notification sent

## 📧 **Email Configuration**

### **Gmail SMTP Setup**
1. Enable 2-Step Verification on Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `EMAIL_PASSWORD` in `.env` file
4. Restart application

### **Email Templates**
- **Registration Verification**: Account activation
- **Booking Confirmation**: Booking details and ticket
- **Password Reset**: Secure password recovery
- **Booking Cancellation**: Refund information

## 🎨 **UI/UX Features**

### **Design Principles**
- **Modern Interface**: Clean, professional design
- **Responsive Layout**: Works on all devices
- **Accessibility**: WCAG compliant components
- **Performance**: Optimized loading times
- **User Experience**: Intuitive navigation

### **Key Components**
- **Dashboard Cards**: Statistics and quick actions
- **Flight Cards**: Detailed flight information
- **Search Filters**: Advanced search capabilities
- **Booking Forms**: Step-by-step booking process
- **Payment Interface**: Secure payment flow

## 🔧 **Configuration**

### **Application Properties**
```properties
# Server Configuration
server.port=8085

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/flight_management
spring.datasource.username=root
spring.datasource.password=root

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### **Security Configuration**
- JWT-based authentication
- Role-based access control (USER/ADMIN)
- CORS configuration for frontend
- Password encryption with BCrypt

## 🚀 **Deployment**

### **Development**
```bash
# Run in development mode
mvn spring-boot:run
```

### **Production**
```bash
# Build for production
mvn clean package

# Run JAR file
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### **Docker**

Build the application JAR (including the separately located frontend) from
`backend/`, copy `.env.example` to `.env`, and replace every placeholder with a
unique local value. Then run the application, MySQL, MailHog, Prometheus, and
Grafana with Docker Compose:

```powershell
Copy-Item .env.example .env
# Edit .env and set unique DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD,
# and GRAFANA_ADMIN_PASSWORD values before continuing.
.\backend\mvnw.cmd -f backend\pom.xml package
docker compose --env-file .env -f observability\compose.yaml up --build -d
```

The database health check gates app startup. [smoke-docker.sh](./scripts/smoke-docker.sh) checks application readiness
(including database readiness) and confirms Prometheus HTTP request metrics
are exposed; it tears down the containers but keeps the named data volumes.
The Docker Compose application, MySQL connection, Prometheus scrape, and
Grafana dashboard have been verified locally. A real Jenkins build and
Kubernetes deployment still require their respective services and credentials.

### **Jenkins CI/CD**

The root `Jenkinsfile` runs checkout, Maven build, backend tests, frontend tests,
Selenium login/search/booking/cancellation tests, and a Docker image build in
that order. A failed build or test fails the pipeline and prevents image
publishing and deployment. Deployment runs only from the `main` branch.

Configure a dedicated Linux Jenkins agent with Java 17, Node.js 20+/npm,
Docker (daemon access), `curl`, `jq`, and `kubectl`. Ports 3306, 4444, 8085, and 1025
must be available on that agent while tests run. Set the Jenkins parameters
`IMAGE_REPOSITORY` and `K8S_NAMESPACE` to match your GHCR package and cluster.
`IMAGE_REPOSITORY` must use the fixed `ghcr.io/owner/image` form. Create Jenkins credentials with
the fixed IDs `flight-registry` (a package-scoped registry username/password)
and `flight-kubeconfig` (a kubeconfig secret file); these IDs and the registry
host are intentionally not build parameters. The Kubernetes cluster must already have a reachable MySQL database and a
`flight-management-secrets` Secret in the selected namespace containing the application Secret with `DB_URL`,
`DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, and any required
`ADMIN_EMAIL`, email, and payment settings. `JWT_SECRET` must be unique and at
least 32 characters; admin passwords must be at least 12 characters.
Create the namespace and the secrets before the first deployment. Create them
without committing secret values:

```bash
kubectl create namespace flight-management
kubectl create secret generic flight-management-secrets -n flight-management \
  --from-literal=DB_URL='jdbc:mysql://mysql.example.svc.cluster.local:3306/flight_management' \
  --from-literal=DB_USERNAME='<database-user>' \
  --from-literal=DB_PASSWORD='<database-password>' \
  --from-literal=JWT_SECRET='<unique-random-secret-32-characters-or-more>' \
  --from-literal=ADMIN_EMAIL='admin@example.com' \
  --from-literal=ADMIN_PASSWORD='<unique-password-12-characters-or-more>'
kubectl create secret generic grafana-admin-credentials -n flight-management \
  --from-literal=admin-password='<unique-grafana-password>'
```

The example at `k8s/secret.example.yaml` is a template only; do not apply it
without replacing every placeholder. The pushed image must be publicly
pullable by the cluster; for a private registry, add an image pull secret to
`k8s/deployment.yaml`.

Backend tests use an isolated in-memory H2 database; Selenium tests start
disposable MySQL, MailHog, and Selenium containers and remove them afterward.
The pipeline builds the deployable application image only after all test
stages pass. Kubernetes application manifests are in `k8s/`;
Prometheus and Grafana are installed from `k8s/monitoring/`. To demonstrate the
test gate, run the Jenkins job with `DEMONSTRATE_TEST_FAILURE=true`: the
frontend test runner executes an intentionally failing Jest assertion. The
pipeline must then mark Selenium, Docker image build, and Kubernetes deployment
as skipped. Do not enable this parameter for a normal build.

The Jenkinsfile is ready to use with a GitHub-backed Jenkins Pipeline job, but
this workspace is not connected to a GitHub remote and does not have a
Kubernetes context configured. Configure the GitHub repository/webhook, Jenkins
plugins and credentials, and a reachable cluster before claiming that remote
CI/CD deployment has been demonstrated.

For a local failure-gate check, run `npm ci` in `frontend/`, then run these
PowerShell commands. Jest should fail the named demo test; this local check
does not deploy anything. In Jenkins, enable the same parameter and confirm
that Selenium, Docker image build, and deployment are skipped.

```powershell
$env:DEMONSTRATE_TEST_FAILURE = 'true'
npm.cmd test -- --watchAll=false --runInBand
Remove-Item Env:DEMONSTRATE_TEST_FAILURE
```

To connect GitHub, push this project to a repository and create a Jenkins
Pipeline job using **Pipeline script from SCM**, the Git repository URL, and
the root `Jenkinsfile`. Configure the GitHub Branch Source/GitHub integration
and a webhook to notify Jenkins of pushes and pull requests. The Jenkins agent
must be Linux-based and have the tools listed above; configure `flight-registry`
and `flight-kubeconfig` credentials before enabling deployment.

## 🧪 **Testing**

### **Backend Tests**
```bash
# Backend tests use the isolated H2 database in src/test/resources.
# MySQL is used by the Docker Compose app and Selenium integration flow.
cd backend
./mvnw test

# Windows
.\mvnw.cmd -B test

# Run specific test class
./mvnw -Dtest=AuthServiceTest test
```

### **Frontend Tests**
```bash
cd frontend
npm ci
npm test
```

To run the frontend and backend separately during development, start Spring
Boot from `backend/` with the required environment variables configured, then
start React from `frontend/`:

```bash
# Terminal 1
cd backend
mvnw.cmd spring-boot:run

# Terminal 2
cd frontend
npm start
```

The React development server runs on port 3000 and proxies API requests to the
backend on port 8085. For a combined production build, run `.\mvnw.cmd package`
from `backend/`.

The Selenium browser flow runs in Jenkins with disposable MySQL, MailHog, and
Chrome containers, generated unique test accounts/flights, and demo payment;
no real payment service or email account is used. It can be run locally with
the same services reachable at the configured Selenium and app URLs:
`npm run test:e2e` from `frontend/`.

## 📈 **Performance**

### **Optimization Features**
- **Database Indexing**: Optimized queries
- **Caching**: Redis integration ready
- **Lazy Loading**: Efficient data fetching
- **Image Optimization**: Compressed assets
- **Code Splitting**: Reduced bundle size

### **Monitoring**

Implemented monitoring uses Spring Boot Actuator and Micrometer Prometheus.
`/actuator/health`, `/actuator/health/readiness`,
`/actuator/health/liveness`, and `/actuator/prometheus` are exposed; the
readiness group includes database health. Kubernetes readiness and liveness
probes use the corresponding health endpoints. Prometheus scrapes the app
service every 15 seconds and has alerts for an unavailable app and elevated
5-minute p95 response time. The provisioned Grafana dashboard shows
availability, p95 latency, request rate, process/system CPU, and JVM heap.

After deployment, access Grafana with a port forward:

```bash
kubectl port-forward -n flight-management service/grafana 3001:3000
```

Sign in with username `admin` and the password stored in
`grafana-admin-credentials`. To demonstrate runtime detection, run
`bash scripts/demo-runtime-failure.sh flight-management`. The script records
the current replica count, scales the app to zero, waits for Prometheus's
`FlightManagementDown` alert to fire, then restores the original replica count
even if the demo fails. The dashboard and Prometheus alert UI can be inspected
while it runs. These manifests configure Prometheus alert rules but do not
configure Alertmanager notification delivery.

## 🔒 **Security Features**

### **Authentication & Authorization**
- **JWT Tokens**: Secure session management
- **Password Encryption**: BCrypt hashing
- **Role-Based Access**: USER/ADMIN permissions
- **Session Management**: Automatic token expiration

### **Data Protection**
- **Input Validation**: SQL injection prevention
- **XSS Protection**: Cross-site scripting prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **HTTPS Ready**: SSL/TLS configuration

## 🤝 **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request
5. Code review and merge

### **Code Standards**
- **Java**: Follow Google Java Style Guide
- **React**: Follow Airbnb JavaScript Style Guide
- **Comments**: Document complex logic
- **Testing**: Write unit tests for new features

## 📞 **Support**

### **Common Issues**
- **Port 8085 in use**: Kill process or change port
- **Database connection**: Check MySQL service
- **Email not working**: Verify Gmail app password
- **Build failures**: Clean and rebuild

### **Debugging**
```bash
# Enable debug logging
logging.level.com.flight.backend=DEBUG

# Check application logs
tail -f logs/application.log
```

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Spring Boot**: Backend framework
- **React**: Frontend framework
- **Razorpay**: Payment gateway
- **MySQL**: Database management
- **Gmail**: Email service provider

---

## 📞 **Contact Information**

**Developer**: Aditya Raj Sawale  
**Email**: adityaraj.sawale@example.com  
**Project**: Flight Management System  
**Version**: 1.0.0  

---

**🎓 Project completed for academic demonstration purposes**  
**✈️ Ready for production deployment**
