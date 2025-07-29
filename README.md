# Game Craft

Game Craft is a web application designed for managing an online PC parts ordering system. It allows users to browse menu items, add them to their cart, and proceed to checkout. The application features an admin dashboard for managing users, products, and orders.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User  Authentication**: Users can register, log in, and manage their accounts.
- **Admin Dashboard**: Admin users can manage users, products, and orders.
- **Cart Management**: Users can add, update, and remove items from their cart.
- **Checkout Process**: Users can enter delivery addresses and complete their orders.
- **Responsive Design**: The application is designed to work on both mobile and desktop devices.

## Technologies Used

- **Frontend:**
  - React
  - React Router
  - Axios
  - Bootstrap

- **Backend:**
  - Node.js
  - Express
  - MongoDB
  - Mongoose
  - JWT for authentication

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Faraz-Ibrar/Game-Craft.git
Navigate to the backend directory and install dependencies:

bash
Run
Copy code
cd game-craft/backend
npm install
Create a .env file in the backend directory and add your MongoDB connection string:

plaintext
Run
Copy code
MONGO_URI=your_mongodb_connection_string
Start the backend server:

bash
Run
Copy code
npm start
Navigate to the frontend directory and install dependencies:

bash
Run
Copy code
cd ../frontend
npm install
Start the frontend application:

bash
Run
Copy code
npm start
Usage
Open your browser and go to http://localhost:3000 to access the application.
Users can register, log in, browse menu items, and manage their cart.
Admin users can access the admin dashboard to manage users, products, and orders.
API Endpoints
Cart Routes
Create or Update Cart: POST /api/cart

Request Body: { "userId": "string", "items": [{ "menuItemId": "string", "name": "string", "image": "string", "price": number, "serves": number }] }
Get Cart by User ID: GET /api/cart/:userId

Delete Cart by User ID: DELETE /api/cart/:userId

Checkout Routes
Create a New Checkout: POST /api/checkout

Request Body: { "userId": "string", "cartItems": [{ "menuItemId": "string", "name": "string", "image": "string", "price": number, "serves": number }], "totalAmount": number, "deliveryAddress": "string" }
Get All Checkouts: GET /api/checkout

Get Checkout by ID: GET /api/checkout/:id

Menu Item Routes
Get All Menu Items: GET /api/menu-items

Create a New Menu Item (Admin Only): POST /api/menu-items

Request Body: { "name": "string", "price": number, "serves": number, "image": "string", "description": "string", "category": "string" }
Update a Menu Item by ID (Admin Only): PUT /api/menu-items/:id

Delete a Menu Item by ID (Admin Only): DELETE /api/menu-items/:id

Folder Structure
Run
Copy code
GAME CRAFT/
├── backend/
│   ├── configurations/          # Configuration files (e.g., for environment variables)
│   ├── controllers/             # Business logic for handling requests
│   ├── models/                  # Mongoose models for MongoDB
│   ├── routes/                  # API route definitions
│   ├── .env                     # Environment variables
│   ├── package.json             # Backend dependencies
│   └── server.js                # Entry point for the backend server
├── frontend/
│   ├── public/                  # Static files (e.g., index.html)
│   ├── src/                     # Source files for the React application
│   │   ├── Components/          # React components
│   │   ├── App.js               # Main application component
│   │   └── index.js             # Entry point for the React application
│   ├── package.json             # Frontend dependencies
│   └── README.md                # Frontend documentation
Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

Steps to Contribute:
Fork the repository.
Create a new branch (git checkout -b feature/YourFeature).
Make your changes and commit them (git commit -m 'Add some feature').
Push to the branch (git push origin feature/YourFeature).
Open a pull request.
License
This project is licensed under the MIT License - see the LICENSE file for details.

Run
Copy code

### Notes:
- Replace `yourusername` in the clone URL with your actual GitHub username.
- Ensure that the API endpoints and request bodies match your actual implementation.
- You can add more sections or details as needed, such as screenshots, usa   
