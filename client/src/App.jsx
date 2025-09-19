import React from 'react'
import { Routes,Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import EmailVerify from './pages/EmailVerify'
import ResetPassword from './pages/ResetPassword'
import { ToastContainer, toast } from 'react-toastify';
import Notes from './pages/Notes'
import { Navigate } from 'react-router-dom'
import { AppContext } from './context/AppContext'
import { useContext } from 'react'

const App = () => {

 const {userData} =useContext(AppContext);
  return (

    <div>
      <ToastContainer/>
      <Routes>
        <Route path="/" element={ <Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/email-verify" element={<EmailVerify/>}/>
        <Route path="/reset-password" element={<ResetPassword/>}/>
        <Route path="/notes" element={userData?<Notes/>:<Navigate to={"/login"}/>}/>
        
      </Routes>
    </div>
  )
}

export default App