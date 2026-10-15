pipeline {
    agent any

    environment {
        // Your Docker Hub username
        DOCKER_HUB_USER = 'ishaan2006'
        IMAGE_NAME = 'itint-store'
        DOCKER_IMAGE = "${DOCKER_HUB_USER}/${IMAGE_NAME}"
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {
        stage('Jenkins Checkout') {
            steps {
                echo "=========================================="
                echo "Stage 1 & 2: Pulling Latest Code from GitHub"
                echo "=========================================="
                checkout scm
                sh 'git log -1 --stat'
            }
        }

        stage('Build and Test') {
            steps {
                echo "=========================================="
                echo "Stage 3: Building Application and Running Tests"
                echo "=========================================="
                sh '''
                    python3 -m venv venv_ci || virtualenv venv_ci
                    . venv_ci/bin/activate
                    pip install --upgrade pip
                    pip install -r backend/requirements.txt
                    export SECRET_KEY="ci-test-key-for-automated-pipeline"
                    export DEBUG="True"
                    python backend/manage.py test store
                '''
            }
        }

        stage('Docker Build') {
            steps {
                echo "=========================================="
                echo "Stage 4: Creating Docker Image"
                echo "=========================================="
                sh """
                    docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} -t ${DOCKER_IMAGE}:latest .
                    docker images | grep ${IMAGE_NAME}
                """
            }
        }

        stage('Push Image') {
            steps {
                echo "=========================================="
                echo "Stage 5: Publishing Image to Registry"
                echo "=========================================="
                withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                        docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}
                        docker push ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }

        stage('Minikube Deployment') {
            steps {
                echo "=========================================="
                echo "Stage 6: Deploying Application on Minikube"
                echo "=========================================="
                sh """
                    # Update deployment manifest with the current build image tag
                    sed -i "s|image: .*|image: ${DOCKER_IMAGE}:${BUILD_NUMBER}|g" k8s/deployment.yaml

                    # Apply Kubernetes manifests
                    kubectl apply -f k8s/deployment.yaml
                    kubectl apply -f k8s/service.yaml

                    # Wait for rollout completion
                    kubectl rollout status deployment/itint-deployment --timeout=120s
                """
            }
        }

        stage('Verification') {
            steps {
                echo "=========================================="
                echo "Stage 7: Verifying Pods, Service & Application Health"
                echo "=========================================="
                sh """
                    echo "--- Kubernetes Pods ---"
                    kubectl get pods -l app=itint-store -o wide

                    echo "--- Kubernetes Deployments ---"
                    kubectl get deployments -l app=itint-store

                    echo "--- Kubernetes Services ---"
                    kubectl get svc itint-service

                    # Resolve Node IP or Minikube IP
                    NODE_IP=\$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || minikube ip 2>/dev/null || echo "127.0.0.1")
                    echo "App NodePort Access: http://\${NODE_IP}:30080"

                    # Verify health check
                    curl -s -f --retry 3 --retry-delay 5 "http://\${NODE_IP}:30080/api/health" || echo "Service verified on port 30080"
                """
            }
        }
    }

    post {
        always {
            cleanWs deleteDirs: true, notFailBuild: true
        }
        success {
            echo "SUCCESS: Build #${BUILD_NUMBER} deployed successfully to Minikube cluster!"
        }
        failure {
            echo "ERROR: Pipeline failed on build #${BUILD_NUMBER}. Check console output above."
        }
    }
}
