**DevOps Initial Project Planning Document**

**Project Title:** AutoHub – Car Showroom Management System

---

# **1\. Team Details**

**Team Name:** AutoHub

**Member Names & Roll Numbers:**

* Mohammed Faisal – 1MS23CS112  
* Mohamed Qurrain – 1MS23CS110  
* Janet Megha King – 1MS23CS078

**Roles of Each Member:**

* **Mohammed Faisal:** Application development, database integration, DevOps pipeline setup  
* **Mohamed Qurrain:** Containerization, Deployment automation  
* **Janet Megha King:** Monitoring configuration, Security

---

# **2\. Project Title and Description**

**Title:** AutoHub – Car Showroom Management System

**Description:**  
AutoHub is a web-based car showroom management system designed to help showroom administrators manage vehicle inventory, customers, sales, rentals, and test drives efficiently. The system provides a centralized dashboard that displays key showroom features and allows staff to manage operations such as adding vehicles, tracking customer purchases, scheduling test drives, and managing rentals.

# **3\. Objective**

The objective of this project is to implement a complete DevOps pipeline for the AutoHub application. Through this pipeline, we aim to automate the process of building, testing, containerizing, and deploying the application while ensuring system reliability, scalability, and monitoring.

Key goals include:

* Automating application build and deployment using CI/CD pipelines.

* Containerizing the application for consistent environments.

* Implementing monitoring tools to track system performance and reliability.

* Using Infrastructure as Code (IaC) to automate environment setup.

---

# **4\. Tools & Technologies (Initial Selection)**

### **Infrastructure as Code (IaC)**

* Terraform – for provisioning cloud infrastructure.

* Ansible – for configuration management and server setup.

### **CI/CD**

* GitHub Actions – for automating build, test, and deployment workflows.

### **Containerization**

* Docker – to containerize the application.

* Kubernetes – for container orchestration and scaling.

### **Testing**

* Postman – for API testing.

### **Monitoring**

* Prometheus – for system metrics monitoring.

* Grafana – for visualizing application and infrastructure metrics.

### 

### 

### **Secrets / Security**

* HashiCorp Vault – for managing secrets and sensitive credentials.

* GitHub Secrets – for securely storing CI/CD credentials.

---

# **5\. Initial Timeline**

| Phase | Planned Activities |
| ----- | ----- |
| Week  1 | Team formation, finalize project idea, assign roles |
| Week 2 | Setup GitHub repository and initial application development |
| Week 3 | Setup Docker containerization for the application |
| Week 4 | Implement CI/CD pipeline using GitHub Actions |
| Week 5 | Configure Infrastructure using Terraform |
| Week 6 | Deploy application using Kubernetes |
| Week 7 | Implement monitoring using Prometheus and Grafana |
| Week 8 | Testing, debugging, and final optimization |

---

# **6\. Expected Risks or Challenges**

Some potential challenges that may arise during the project include:

* Difficulty in configuring Kubernetes clusters and container orchestration.

* Integration challenges between CI/CD tools and cloud infrastructure.

* Managing secrets securely in the deployment pipeline.

* Handling deployment failures and debugging pipeline issues.

To handle these risks, we will perform regular testing, maintain proper documentation, and continuously monitor the pipeline and infrastructure performance.