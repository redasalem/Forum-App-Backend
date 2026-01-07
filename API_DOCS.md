# Forum App API Documentation 📚

**Base URL:** `http://localhost:5000/api`

---

## 🔐 Authentication

### Register (POST /auth/register)

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

### Login (POST /auth/login)

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "avatar": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

⚠️ **انسخ الـ token واستخدمه في الـ Header كالتالي:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Change Password (PUT /auth/password) 🔒

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

### Get Current User (GET /auth/me) 🔒

No body required - just add Authorization header

---

## 📝 Topics

### Get All Topics (GET /topics)

No body required

- Optional query params: `?page=1&limit=20`

### Get Topic by ID (GET /topics/:id)

No body required

### Create Topic (POST /topics) 🔒

```json
{
  "title": "How to build a React Native app?",
  "content": "I want to learn how to build a mobile app using React Native. Can anyone share some resources or tips for beginners?",
  "tags": ["react-native", "mobile", "beginner"]
}
```

### Update Topic (PUT /topics/:id) 🔒

```json
{
  "title": "Updated: How to build a React Native app?",
  "content": "Updated content here...",
  "tags": ["react-native", "updated"]
}
```

### Delete Topic (DELETE /topics/:id) 🔒

No body required

### Get Topic Replies (GET /topics/:id/replies)

No body required

- Optional query params: `?page=1&limit=20`

---

## 💬 Replies

### Create Reply (POST /replies) 🔒

```json
{
  "content": "Great question! I recommend starting with the official React Native documentation.",
  "topicId": "TOPIC_ID_HERE"
}
```

### Update Reply (PUT /replies/:id) 🔒

```json
{
  "content": "Updated reply content here..."
}
```

### Delete Reply (DELETE /replies/:id) 🔒

No body required

---

## 👤 Users

### Get My Profile (GET /users/me) 🔒

No body required

### Update My Profile (PUT /users/me) 🔒

```json
{
  "username": "newusername",
  "bio": "I am a software developer passionate about React Native!"
}
```

### Get User by ID (GET /users/:id)

No body required

### Get User Topics (GET /users/:id/topics)

No body required

- Optional query params: `?page=1&limit=10`

### Get User Replies (GET /users/:id/replies)

No body required

- Optional query params: `?page=1&limit=10`

---

## 🔑 Legend

- 🔒 = Requires Authorization header with Bearer token
- All requests with body need `Content-Type: application/json` header

---

## 📥 Postman Collection

Import the file `Forum_App_API.postman_collection.json` into Postman for ready-to-use requests!
