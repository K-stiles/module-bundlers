import React, { Suspense } from "react";
import "./app.css";
import testImage from "../public/test-image.jpeg";
import Button from "./components/button";
const DynamicComponent = React.lazy(() =>
  import(/* webpackChunkName: DynamicComponentChunk*/ "./components/dynamic-component")
);

export default function App() {
  return (
    <div className="container">
      <h1>Hello, Webpack Bundler!</h1>

      {/*
      button is used more than once hence button chunk should be included in the common chunk not in the main bundle
      check: optimization.splitChunks for more details
      */}
      <Button />

      <div className="text">
        <h2>Global(environment) Variables:</h2>
        <p>API URL: {SERVER_API_URL}</p>
        <p>Secrete Key: {SECRETE_API_KEY}</p>
      </div>

      {/* DynamicComponent is async(lazily loaded) hence will be included in the common chunk.
      check: optimization.splitChunks for more details
       */}
      <Suspense fallback={<div>Loading...</div>}>
        <DynamicComponent />
      </Suspense>

      <img src={testImage} alt="Test" />
    </div>
  );
}
