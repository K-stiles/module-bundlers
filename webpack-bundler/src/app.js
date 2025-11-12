import React from "react";
import "./app.css";
import testImage from "../public/test-image.jpeg";

export default function App() {
  return (
    <div className="container">
      <h1>Hello, Webpack Bundler!</h1>
      <div>
        Environment Variables:
      <div>API URL: {SERVER_API_URL}</div>
      <div>Secrete Key: {SECRETE_API_KEY}</div>
      </div>

        <img src={testImage} alt="Test" />
    </div>
  );
}
