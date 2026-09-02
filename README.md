# Multi-Tenant CRM

A full-stack Multi-Tenant Customer Relationship Management (CRM) system designed to help organizations manage tenants, leads, pipelines, tasks, and users through role-based dashboards.

The system provides separate functionality for **Super Admins, Admins, and Users**, with secure authentication and tenant-based data management.

## Features

### Super Admin

* Super Admin dashboard
* Tenant management
* Create, update, and manage tenants
* Monitor tenant information and system activity

### Admin

* Admin dashboard
* Lead management
* Pipeline and stage management
* Kanban-style task organization
* User management
* Task management

### User

* Access assigned tasks and CRM features
* Manage tasks within assigned workflows
* Interact with pipeline and lead-related functionality

### Authentication & Authorization

* JWT-based authentication
* Access and refresh token handling
* HTTP-only refresh token cookies
* Role-based access control
* Multi-tenant authorization

### Task & Pipeline Management

* Create and manage pipelines
* Create and manage pipeline stages
* Drag-and-drop Kanban functionality
* Task assignment and management
* Persistent task and pipeline data

## Screenshots

### Login

<img width="1920" height="909" alt="image" src="https://github.com/user-attachments/assets/7e0aac54-cd33-4633-a471-013b601541c0" />


The authentication interface for users to securely access the CRM system.

### Forget Password

<img width="1920" height="909" alt="image" src="https://github.com/user-attachments/assets/17f8488d-aa73-4d94-b972-92d99864c7e9" />

Password can be reset using an OTP (One-Time Password) for secure account verification.

### Super Admin Dashboard

<img width="1920" height="1147" alt="image" src="https://github.com/user-attachments/assets/86b0ca67-15e7-473a-8377-0e28659a47ca" />

Provides an overview of the system and allows the Super Admin to manage tenants.

### Tenant Management

<img width="2075" height="892" alt="image" src="https://github.com/user-attachments/assets/009eb18a-e51b-4f2c-98b1-ed9fc21fcb87" />

Allows the Super Admin to view, create, update, and manage tenants.

### Tenant's User Management

<img width="1976" height="878" alt="image" src="https://github.com/user-attachments/assets/2d7e32b8-2da2-43da-81ad-1f560d50094f" />

Allows the superadmin to view, create,updated and manage the users of each tenant.

### Pofile Page

<img width="1920" height="1173" alt="image" src="https://github.com/user-attachments/assets/bfc3d0f8-b863-4388-af16-92d780728e8f" />

Allows sueradmin to change his profile.

### Admin Dashboard

<img width="1920" height="1219" alt="image" src="https://github.com/user-attachments/assets/f24f8634-8c69-4c61-9aa0-92cfe1504c54" />

Provides administrators with an overview of their organization's CRM activities.

### Leads Management

<img width="1920" height="901" alt="image" src="https://github.com/user-attachments/assets/d4cea501-ae2d-4598-8a0d-af3bc619b75d" />

Allows admin to create, view, update, and manage leads.

### Lead Profile Management

<img width="1920" height="1204" alt="image" src="https://github.com/user-attachments/assets/adfb9b17-9c26-4da0-b148-ddf82d842929" />


### Pipeline & Kanban

<img width="2036" height="1278" alt="image" src="https://github.com/user-attachments/assets/a54435af-4ee5-428f-a226-b4e6baea078c" />

Provides visual pipeline management with stages and drag-and-drop functionality.

### Task Management

<img width="1920" height="948" alt="image" src="https://github.com/user-attachments/assets/b44ffee3-8a83-4201-a16e-fb2eb02b7f0c" />

Allows users to create, assign, organize, and manage tasks.

### User Management

<img width="1976" height="878" alt="image" src="https://github.com/user-attachments/assets/48982743-1c7c-48a8-93e8-54036bf23ac8" />

Allows administrators to manage users within their organization.

### Task Drawer

<img width="1920" height="977" alt="image" src="https://github.com/user-attachments/assets/fb9ef7b5-85a7-49e1-b266-69be30235505" />

Shows the tasks details and allows to mark as completed, edit,delete, etc.

### User Page

<img width="1920" height="978" alt="image" src="https://github.com/user-attachments/assets/1c966a0d-9c3a-4e75-ba70-652ecb783a47" />

Shows each users info and the activity abd the tasks.

### User Dashboard

<img width="1920" height="1147" alt="image" src="https://github.com/user-attachments/assets/c6be6705-3969-4eaa-b7f4-979e6bce957b" />

Provides users with an overview of their organization's CRM activities which are associated with them.

### Leads Page

<img width="1920" height="878" alt="image" src="https://github.com/user-attachments/assets/a99d5b9f-4913-4da1-8347-8d90bf9def5e" />

Shows the leads which wre assign to the user.

### Leads Management

<img width="1920" height="1204" alt="image" src="https://github.com/user-attachments/assets/9bf86acb-95e0-4076-8f93-219d4763d967" />

User can updated the leads but only specific things they are allowed for.

### Tasks page

<img width="1920" height="948" alt="image" src="https://github.com/user-attachments/assets/59c139f9-6655-4699-9752-0d592beffbe6" />

Shows the users tasks which are assigned to them.

### Task Drawer

<img width="1920" height="948" alt="image" src="https://github.com/user-attachments/assets/2dec0d7d-bd74-422b-a53e-bdfa6862ac95" />

Allow users to comment, uploaod the documents related to the tasks and mark them complete & incomplete.

## Tech Stack

### Frontend

* React.js
* Next.js
* JavaScript
* Tailwind CSS
* Mantine
* Shadcn UI
* React Hook Form
* Mantine React Table
* dnd-kit

### Backend

* Node.js
* Express.js
* PostgreSQL
* Sequelize
* JWT

### Development & Deployment

* Git
* GitHub
* Docker
* Vercel
* Neon DB

## Architecture

The application follows a full-stack architecture with a frontend client communicating with backend REST APIs.

```text
Frontend
   │
   │ REST API
   ▼
Backend (Node.js + Express)
   │
   ├── PostgreSQL
```

The system uses role-based access control and tenant-aware data handling to ensure that users access functionality and data according to their assigned roles and organization.

## Project Structure

```text
Multi-Tenant-CRM/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   └── ...
│
├── README.md
└── ...
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* PostgreSQL
* Git

### Clone the Repository

```bash
git clone https://github.com/HAFSA-TAHIR133/Multi-Tenant-CRM/new/main
cd Multi-Tenant-CRM
```

### Install Dependencies

Install dependencies for both the frontend and backend.

```bash
cd frontend
npm install
```

```bash
cd ../backend
npm install
```

### Environment Variables

Create `.env` files according to the environment configuration required by the frontend and backend.

Do not commit actual passwords, API keys, JWT secrets, database credentials, or other sensitive information.


## Running the Application

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

The application can then be accessed through the local development URL provided by the frontend.

## Demo

Live Demo: *https://multi-tenant-crm-8omk.vercel.app/login**

GitHub Repository: **https://github.com/HAFSA-TAHIR133/Multi-Tenant-CRM/new/main**

## Project Highlights

* Developed a complete multi-tenant CRM system.
* Implemented role-based dashboards for Super Admins, Admins, and Users.
* Built lead, pipeline, task, and user management modules.
* Implemented Kanban-style drag-and-drop functionality.
* Developed RESTful APIs and integrated frontend and backend services.
* Implemented JWT-based authentication and authorization.
* Integrated PostgreSQL for persistent data storage.
* Task notifications and the lead associated are sent through email.
* Also implement forget password functionality with OTP.

## Future Improvements

* Advanced CRM analytics and reporting
* Additional automation features
* Improved monitoring and logging


### Author
Hafsa Tahir
