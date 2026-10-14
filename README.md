# itint — E-Commerce Storefront & API

Production-ready e-commerce platform for **itint** (Liptints by Aline). Built with a decoupled vanilla HTML5/CSS/JS frontend served via WhiteNoise, a high-performance Django 6 + Django Ninja REST API, and Razorpay payment integration.

---

## Architecture Overview

- **Frontend**: Glassmorphic SPA (`frontend/index.html`, `style.css`, `script.js`).
- **Backend**: Django 6.0.8, Django Ninja 1.6.2, Django ORM.
- **Static Assets**: WhiteNoise (`whitenoise.storage.CompressedStaticFilesStorage`) serving root storefront and static files.
- **Database**: PostgreSQL (production via `DATABASE_URL`), SQLite fallback locally.
- **Payments**: Razorpay Orders, HMAC signature verification, and idempotently handled webhooks.
- **Security**: Strict CORS, CSRF protection, HSTS, SSL redirects, rate limiting on sensitive endpoints, and no hardcoded secret keys.
- **CI/CD & DevOps**: Automated Jenkins Pipeline, Docker containerization, and Minikube Kubernetes deployment (see full [DEVOPS_REPORT.md](DEVOPS_REPORT.md)).

---

## 🚀 CI/CD Pipeline & Kubernetes Deployment (CCA 2 Submission)

This repository implements a fully automated end-to-end CI/CD delivery pipeline using **Jenkins**, **Docker**, **Docker Hub**, and **Minikube (Kubernetes)** hosted on AWS EC2, in fulfillment of the **CCA 2 — Cloud Computing and DevOps** assignment.

### 📋 Submission Checklist & Manifests
- **GitHub Repository**: [`https://github.com/IshaanDhore/Itint-E-commerce`](https://github.com/IshaanDhore/Itint-E-commerce)
- **Declarative Pipeline**: [`Jenkinsfile`](Jenkinsfile)
- **Container Specification**: [`Dockerfile`](Dockerfile)
- **Kubernetes Manifests**: [`k8s/deployment.yaml`](k8s/deployment.yaml) and [`k8s/service.yaml`](k8s/service.yaml)
- **Comprehensive DevOps Report**: [`DEVOPS_REPORT.md`](DEVOPS_REPORT.md)

### 🔄 The 7 Automated Pipeline Stages
| Step | Stage Name | What Happens |
| :--- | :--- | :--- |
| **1** | **Source Code** | Project source is tracked in GitHub repository with Git version control. |
| **2** | **Jenkins Checkout** | Jenkins pulls the latest source code commit from GitHub `main` branch. |
| **3** | **Build and Test** | Creates virtual environment, installs dependencies, and runs `python backend/manage.py test store`. |
| **4** | **Docker Build** | Builds an optimized container image tagged with `ishaandhore/itint-store:${BUILD_NUMBER}` and `:latest`. |
| **5** | **Push Image** | Authenticates securely with Docker Hub using Jenkins credentials and pushes versioned images. |
| **6** | **Minikube Deployment** | Patches `k8s/deployment.yaml` with the current build image tag and performs a zero-downtime rolling update. |
| **7** | **Verification** | Validates running pods, deployments, services, and queries `/api/health` with `curl` for HTTP 200 response. |

*(For full AWS EC2 setup commands, Jenkins configuration, and Viva preparation, read [DEVOPS_REPORT.md](DEVOPS_REPORT.md))*

---

## Local Development

### 1. Prerequisites
- Python 3.12+ / 3.13+
- Virtual environment (`venv`)

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/IshaanDhore/Itint-E-commerce.git
cd Itint-E-commerce

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Copy example environment file
cp .env.example backend/.env
# Edit backend/.env to configure your SECRET_KEY and Razorpay Test credentials

# Run database migrations
python backend/manage.py migrate

# Create initial product in DB (if needed) via Django Admin or shell
python backend/manage.py createsuperuser

# Start development server
python backend/manage.py runserver
```
Visit `http://localhost:8000/` to preview the storefront and `http://localhost:8000/api/docs` for the interactive OpenAPI documentation.

---

## Deployment

This repository is pre-configured with a Render blueprint (`render.yaml`) and a standard `Procfile` compatible with Render, Railway, Heroku, or any VPS.

### Step 1: Render One-Click Blueprint
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Blueprint** and select `render.yaml`.
3. Render will provision:
   - A managed PostgreSQL database (`itint-db`).
   - A Python web service running `build.sh` and served with `gunicorn`.

### Step 2: Configure Environment Variables
In your production dashboard, configure the following secrets (do NOT commit these to git):
- `SECRET_KEY`: Long, random secret string (Render automatically generates this).
- `DEBUG`: Set to `False`.
- `ALLOWED_HOSTS`: Your live domain (e.g. `your-app.onrender.com`).
- `CSRF_TRUSTED_ORIGINS`: Full URL scheme (e.g. `https://your-app.onrender.com`).
- `CORS_ALLOWED_ORIGINS`: Allowed client domains (e.g. `https://your-app.onrender.com`).
- `DATABASE_URL`: Automatically linked from PostgreSQL service.
- `RAZORPAY_KEY_ID`: Your live Razorpay Key ID (`rzp_live_...`).
- `RAZORPAY_KEY_SECRET`: Your live Razorpay Secret Key.
- `RAZORPAY_WEBHOOK_SECRET`: Secret string configured in your Razorpay Webhook settings.
- `RAZORPAY_CURRENCY`: Default `INR`.
- `SECURE_SSL_REDIRECT`: Set to `True`.

### Step 3: Configure Razorpay Webhook
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** > **Webhooks** > **Add New Webhook**.
3. **Webhook URL**: `https://<your-production-domain>/api/webhook`
4. **Secret**: Enter a strong random secret and copy the identical value to `RAZORPAY_WEBHOOK_SECRET` in your server environment variables.
5. **Active Events**: Select `order.paid`.
6. Click **Save Webhook**.

### Step 4: Switch from Test to Live Keys
1. In the Razorpay Dashboard header, toggle from **Test Mode** to **Live Mode**.
2. Navigate to **Settings** > **API Keys** > **Generate Live Key**.
3. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in your host environment.

### Step 5: Create Production Admin Superuser
Run an SSH console / one-off command in your host dashboard:
```bash
python backend/manage.py createsuperuser
```
Log in at `https://<your-production-domain>/admin/` to populate your product catalog and inspect incoming customer orders.

### Step 6: Post-Deploy Smoke-Test Checklist
- [ ] **Health Endpoint**: `curl https://<domain>/api/health` returns `{"status":"ok","service":"itint-backend"}` (HTTP 200).
- [ ] **Storefront Assets**: Visit `https://<domain>/`. Verify styles, images, and fonts load with 0 404s.
- [ ] **Product Loading**: Verify product price and details load dynamically from `/api/products`.
- [ ] **Cart Flow**: Add an item to cart, adjust quantities, verify drawer opens and counts reflect properly.
- [ ] **Address Geocoding**: Click "Use Current Location" in checkout. Verify permission prompt and address autofill via `/api/reverse-geocode`.
- [ ] **Razorpay Checkout Modal**: Click "Proceed to Payment". Ensure the Razorpay modal opens with the correct amount and currency.
- [ ] **Payment Verification**: Complete a test or live purchase. Verify signature verification passes and Order status updates to `paid` with stock decremented.
- [ ] **Admin Inspection**: Visit `/admin/store/order/` and verify the customer's phone number, shipping address, and payment ID are saved.
- [ ] **Prune Orders Command**: Verify `python backend/manage.py prune_pending_orders --hours 1` runs without errors.
