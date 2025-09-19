import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext()

export const AppContextProvider = (props)=>{
    axios.defaults.withCredentials=true
    const backenedUrl = import.meta.env.VITE_BACKENED_URL || "http://localhost:4000";
    const [isLoggedin,setIsLoggedin] =useState(false);
    const [userData, setUserData] = useState(false);

    const getAuthState =async ()=>{
        try{
           const {data} = await axios.get(backenedUrl + '/api/auth/is-auth')
           if(data.success){
            setIsLoggedin(true)
            getUserData()
           }
        }catch(error){
            toast.error(error.message)
        }

    }

    const getUserData =async ()=>{
        try{
            const {data} =await axios.get(backenedUrl + '/api/user/data')
            data.success? setUserData(data.userData) :toast.error(data.message)
            
        }catch(error){
            if (error.response) {
                toast.error(error.response.data.message);
              } else {
                toast.error(error.message);
              }
        }
    }

    useEffect(()=>{
      getAuthState();
    },[])
    const value = {
      backenedUrl,
      isLoggedin,
      setIsLoggedin,
      userData,
      setUserData,
      getUserData


    }
return (
    <AppContext.Provider value={value}>
    {props.children}

    </AppContext.Provider>
)


}