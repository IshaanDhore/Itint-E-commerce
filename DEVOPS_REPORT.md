# CCA 2 — CI/CD Pipeline Implementation & Deployment Report
**Course**: TYCSE · Cloud Computing and DevOps  
**Project**: itint E-Commerce Platform  
**Total Marks**: 10  

---

## 1. Project Overview & Selection

- **Project Name**: itint — Liptints by Aline (E-Commerce Platform)
- **Repository URL**: `https://github.com/IshaanDhore/Itint-E-commerce`
- **Application Stack**:
  - **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism design system), Vanilla JavaScript (ES6+).
  - **Backend**: Django 6.0.8, Django Ninja 1.6.2 (OpenAPI REST API).
  - **Database**: SQLite3 / PostgreSQL with Django ORM migrations.
  - **Static Serving**: WhiteNoise middleware for compressed static assets.
  - **Payments**: Razorpay gateway integration with signature verification and webhook handlers.

---

## 2. CI/CD Architecture & Pipeline Flow

The automated delivery pipeline is orchestrated through **Jenkins** running on an **AWS EC2 Ubuntu** instance, targeting **Docker Hub** for container registry storage and **Minikube** for Kubernetes container orchestration:

```
[ Developer Push to GitHub ]
             │
             ▼
[ Stage 1 & 2: Jenkins Checkout ]
             │
             ▼
[ Stage 3: Build & Automated Tests (Django manage.py test store) ]
             │
             ▼
[ Stage 4: Docker Build (Dockerfile Multi-stage & Collectstatic) ]
             │
             ▼
[ Stage 5: Push Image to Docker Hub (ishaandhore/itint-store:$BUILD_NUMBER) ]
             │
             ▼
[ Stage 6: Minikube Deployment (kubectl apply -f k8s/) ]
             │
             ▼
[ Stage 7: Health Verification (kubectl get pods,svc & curl /api/health) ]
```

---

## 3. Pipeline Stages Breakdown

| Step | Stage Name | Action Performed | Tools Involved |
| :--- | :--- | :--- | :--- |
| **1 & 2** | **Source Code Checkout** | Pulls the latest commit from GitHub (`main` branch) onto the Jenkins workspace agent. | Git, GitHub, Jenkins |
| **3** | **Build & Test** | Provisions virtualenv, installs `backend/requirements.txt`, and executes `python backend/manage.py test store` to verify business logic, rate limits, and checkout idempotency. | Python, Django, Pytest/Unittest |
| **4** | **Docker Build** | Builds an optimized container image tagging with `${DOCKER_IMAGE}:${BUILD_NUMBER}` and `:latest`. Collects static assets during build. | Docker, Dockerfile |
| **5** | **Push Image** | Uses Jenkins Secret Credentials (`docker-hub-credentials`) to securely log in to Docker Hub and push versioned tags. | Docker Hub, Jenkins Credentials Plugin |
| **6** | **Minikube Deployment** | Patches `k8s/deployment.yaml` with the current `${BUILD_NUMBER}` image tag, applies Deployment & Service manifests, and monitors `rollout status`. | Minikube, kubectl |
| **7** | **Verification** | Inspects running pods, deployments, and NodePort services. Performs automated `curl` against `/api/health` to confirm HTTP 200 availability. | kubectl, curl |

---

## 4. AWS Server & Tool Installation Guide

### Step 4.1: Launch AWS EC2 Instance
- **AMI**: Ubuntu 22.04 LTS (HVM) or 24.04 LTS
- **Instance Type**: `t3.medium` or `t2.medium` (Minimum 2 vCPUs and 4 GB RAM required for Minikube + Jenkins)
- **Storage**: 25 GB gp3 SSD
- **Security Group Inbound Rules**:
  - `SSH` (Port 22) from your IP
  - `Custom TCP` (Port 8080) for Jenkins UI
  - `Custom TCP` (Port 30080) for itint Minikube NodePort service
  - `HTTP` (Port 80) and `HTTPS` (Port 443)

### Step 4.2: Server Setup Commands (Run on AWS EC2)
Connect to your EC2 instance via SSH:
```bash
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
```

Run the automated setup commands:
```bash
# 1. Update system packages
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common git python3-pip python3-venv

# 2. Install Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# 3. Install Jenkins & Java OpenJDK 17
sudo apt-get install -y openjdk-17-jdk
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update
sudo apt-get install -y jenkins
sudo systemctl enable --now jenkins

# 4. Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# 5. Install Minikube
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# 6. Configure Permissions
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins

# 7. Start Minikube (as ubuntu user with docker driver)
minikube start --driver=docker --listen-address=0.0.0.0

# 8. Share Minikube kubeconfig with Jenkins user
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube

# Restart Jenkins to apply group membership
sudo systemctl restart jenkins
```

---

## 5. Jenkins Setup & Job Configuration

1. **Access Jenkins**: Open `http://<ec2-public-ip>:8080` in your browser.
2. **Unlock Jenkins**:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
3. **Install Suggested Plugins**: Select "Install suggested plugins".
4. **Install Required Extra Plugins**:
   - Go to **Manage Jenkins** > **Plugins** > **Available plugins**.
   - Search and install: **Docker Pipeline**, **Credentials Binding**, **Git**.
5. **Add Docker Hub Credentials**:
   - Go to **Manage Jenkins** > **Credentials** > **System** > **Global credentials** > **Add Credentials**.
   - **Kind**: Username with password
   - **Username**: Your Docker Hub username (e.g. `ishaandhore`)
   - **Password**: Your Docker Hub password or Personal Access Token
   - **ID**: `docker-hub-credentials` *(Must match the ID in Jenkinsfile)*
   - Click **Create**.
6. **Create Pipeline Job**:
   - Click **New Item** > Enter name: `itint-ci-cd-pipeline` > Select **Pipeline** > Click **OK**.
   - Scroll down to the **Pipeline** section.
   - **Definition**: Select **Pipeline script from SCM**.
   - **SCM**: Select **Git**.
   - **Repository URL**: `https://github.com/IshaanDhore/Itint-E-commerce.git`
   - **Branch Specifier**: `*/main`
   - **Script Path**: `Jenkinsfile`
   - Click **Save**.

---

## 6. How to Deploy & Verify (Run #1)

1. In Jenkins, open `itint-ci-cd-pipeline` and click **Build Now**.
2. Open the build console output and observe:
   - Git checkout fetches the project.
   - Unit tests run and pass (`Ran 6 tests in 0.265s ... OK`).
   - Docker image builds (`ishaandhore/itint-store:1`).
   - Image pushes to Docker Hub.
   - `k8s/deployment.yaml` and `k8s/service.yaml` apply to Minikube.
   - Pods start (`2/2 Running`).
   - Verification curl hits `/api/health` and returns `{"status":"ok","service":"itint-backend"}`.
3. Access the deployed application:
   ```bash
   # On AWS EC2:
   minikube service itint-service --url
   # Expose port 30080 through public IP or forward:
   kubectl port-forward --address 0.0.0.0 svc/itint-service 8000:8000 &
   ```
   Open `http://<ec2-public-ip>:8000/` to preview the live itint storefront!

---

## 7. Demonstrating Source Code Change (Run #2)

As required by the assignment guidelines:
> *"After the first successful run, you must change the source code, push it, and run the pipeline again to show the new version being deployed."*

### Step 7.1: Make a Visual Code Change
In `frontend/index.html`:
Change the hero banner text or badge:
```diff
- <span class="badge">New Arrival</span>
+ <span class="badge">v2.0 — Special Autumn Edition</span>
```

### Step 7.2: Commit & Push to GitHub
```bash
git add frontend/index.html
git commit -m "Update hero banner to v2.0 Autumn Edition"
git push origin main
```

### Step 7.3: Trigger Pipeline Run #2
1. In Jenkins, click **Build Now** (or let GitHub Webhook trigger it automatically).
2. Jenkins executes Build #2:
   - Builds new Docker tag `ishaandhore/itint-store:2`.
   - Pushes tag `2` to Docker Hub.
   - Performs Kubernetes RollingUpdate with zero downtime (`maxSurge: 1, maxUnavailable: 0`).
   - Old pods terminate gracefully while new pods handle incoming requests.
3. Refresh the browser at `http://<ec2-public-ip>:8000/` to show the updated `v2.0` banner live!

---

## 8. Artifacts Included in this Submission

- [x] **Project Repository**: Clean, well-structured Django 6 + Vanilla JS application.
- [x] [`Dockerfile`](Dockerfile): Container specification with layer caching, static collection, and Gunicorn server.
- [x] [`Jenkinsfile`](Jenkinsfile): 7 declarative stages covering checkout, build/test, docker build, registry push, minikube deploy, and health verification.
- [x] [`k8s/deployment.yaml`](k8s/deployment.yaml): Rolling update deployment with replicas=2, resource limits, and health probes.
- [x] [`k8s/service.yaml`](k8s/service.yaml): NodePort service mapping port 8000 to NodePort 30080.
- [x] [`DEVOPS_REPORT.md`](DEVOPS_REPORT.md): This report covering all evaluation rubric criteria.

---

## 9. Viva Questions & Expected Answers

**Q1: Why did you use NodePort instead of LoadBalancer or ClusterIP?**  
*Answer*: ClusterIP is only accessible from inside the Kubernetes cluster. Minikube is a single-node local cluster where cloud LoadBalancers are not natively provisioned. NodePort exposes static port `30080` on the Minikube node, making the service directly accessible outside the cluster.

**Q2: How does the pipeline ensure zero-downtime deployment during code changes?**  
*Answer*: In `k8s/deployment.yaml`, we configured a `RollingUpdate` strategy with `maxSurge: 1` and `maxUnavailable: 0`. Kubernetes spins up a new pod with the updated image, validates its `readinessProbe` on `/api/health`, and only terminates the old pod after the new one is ready.

**Q3: How are credentials handled securely in the Jenkinsfile?**  
*Answer*: We never hardcode passwords. We use Jenkins' `withCredentials([usernamePassword(...)])` block, which masks secret strings in the console logs (`****`) and safely injects them into the Docker login stdin.

**Q4: What happens if the automated unit tests fail in Stage 3?**  
*Answer*: Jenkins fails fast and halts the pipeline immediately. Docker build and deployment stages are never executed, preventing faulty code from reaching Docker Hub or the production cluster.
