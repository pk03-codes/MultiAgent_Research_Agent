import React from 'react'
import Frontpage from './pages/Frontpage'
import { Route, Routes } from 'react-router-dom'

const App = () => {
  return (
    <div className='bg-black text-2xl text-white'>
      <Routes>
        <Route path='/' element={<Frontpage/>} ></Route>

      </Routes>
      
    </div>
  )
}

export default App