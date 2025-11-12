import React from 'react'
import "./app.css"
import testImage from '../public/test-image.jpeg';

export default function App() {
  return (
    <div className='container'>
      App Component
      <img src={testImage} alt="Test" />
    </div>
  )
}
