# Xaverian ACM Student Chapter – API

This is the official API for the Xaverian ACM Student Chapter. It provides endpoints for managing entities related to the chapter’s website, such as members, users, activities, and authentication.

## 📚 API Documentation

You can explore the available endpoints using the Swagger interface:

**GET** `/swagger`

Open it in your browser at:  
`http://localhost:<PORT>/swagger`

---

## 🚀 Getting Started

### ✅ Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop).
- (Optional) [Bun](https://bun.sh/) if you want to run it locally without Docker.

---

### 🔧 Local Development (with Bun)

```bash
bun install
bun run dev
```

The API will be available at:  
`http://localhost:<PORT>`

---

## 🐳 Running with Docker

### Build the image:

```bash
docker build -t acm-api .
```

### Run the container:

```bash
docker run --env-file .env -p <PORT>:<PORT> acm-api
```

### Test it:

```bash
curl http://localhost:<PORT>/ping
```

---

## ⚙️ Dockerfile Overview

This Dockerfile uses a multi-stage build with [Bun](https://bun.sh) and a [Distroless](https://github.com/GoogleContainerTools/distroless) image for production.

- Installs dependencies with Bun.
- Runs automated tests during build.
- Compiles the app to a single executable using Bun.
- Produces a lightweight, secure image with no shell or unnecessary packages.

---

## 📦 Tech Stack

- [Bun](https://bun.sh) – Fast JavaScript runtime
- [Elysia.js](https://elysiajs.com) – Web framework
- [Swagger](https://swagger.io) – API documentation
- Docker + Distroless – Minimal and secure production containers

---

## 👥 Developers

- [Sebastian Galindo](https://github.com/TalkySafe143)
- [Adrian Ruiz](https://github.com/adrianrrruiz)
