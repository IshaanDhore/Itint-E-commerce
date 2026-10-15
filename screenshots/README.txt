SCREENSHOTS CHECKLIST FOR CCA 2 REPORT (Fig 1 to Fig 13)
=========================================================

Save your screenshots into this 'screenshots/' folder with these exact file names:

Fig 1: fig1_github_repo.png
- Screen: GitHub repository page (https://github.com/IshaanDhore/Itint-E-commerce)
- Showing: main branch, Dockerfile, Jenkinsfile, k8s/ folder, backend/

Fig 2: fig2_aws_ec2.png
- Screen: AWS EC2 Console > Instances
- Showing: Your EC2 instance 'Running' with 2/2 or 3/3 checks passed in ap-south-1

Fig 3: fig3_jenkins_dashboard.png
- Screen: Jenkins Dashboard (http://<EC2-IP>:8080)
- Showing: itint-ci-cd-pipeline with latest successful build weather/status icon

Fig 4: fig4_jenkins_credentials.png
- Screen: Manage Jenkins > Credentials > System > Global credentials
- Showing: docker-hub-credentials with username 'ishaan2006'

Fig 5: fig5_checkout_console.png
- Screen: Build #1 > Console Output (Top)
- Showing: SCM checkout from https://github.com/IshaanDhore/Itint-E-commerce.git on branch 'main'

Fig 6: fig6_stage_view.png
- Screen: Jenkins Pipeline Stage View
- Showing: All 6 stages in green: Checkout, Build and Test, Docker Build, Push Image, Minikube Deployment, Verification

Fig 7: fig7_dockerhub.png
- Screen: Docker Hub (https://hub.docker.com/repository/docker/ishaan2006/itint-store/tags)
- Showing: Tags '1', '2', and 'latest' pushed by Jenkins

Fig 8: fig8_k8s_manifest.png
- Screen: VS Code / IDE
- Showing: k8s/deployment.yaml open in editor with git commit/push in terminal

Fig 9: fig9_deployment_console.png
- Screen: Build #1 > Console Output (Bottom)
- Showing: 'kubectl apply -f k8s/' and rollout status 'Finished: SUCCESS'

Fig 10: fig10_kubectl_verify.png
- Screen: EC2 SSH Terminal
- Showing: Output of:
  kubectl get pods -l app=itint-store
  kubectl get deployment -l app=itint-store
  kubectl get svc itint-service

Fig 11: fig11_app_curl.png
- Screen: EC2 SSH Terminal
- Showing: curl against health check returning:
  {"status":"ok","service":"itint-backend"}

Fig 12: fig12_rerun_verify.png
- Screen: Terminal or Browser
- Showing: Storefront banner showing 'v2.0 — Autumn Edition' deployed after Build #2

Fig 13: fig13_build_history.png
- Screen: Jenkins Pipeline Sidebar
- Showing: Build History showing Build #1 and Build #2 both green
