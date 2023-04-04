import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';
import {
  createBrowserRouter,
  RouterProvider,
  Route
} from 'react-router-dom'
import Home from './components/Home';

const root = ReactDOM.createRoot(
  document.getElementById('root')
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />
  },
  {
    path: "room",
    element: <App />
  }
])

root.render(
  <>
    <RouterProvider router={router} />
  </>
);