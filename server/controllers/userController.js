import userModel from "../models/userModel.js";

export const getUserData =async (req,res)=>{
try{
   const userId = req.user.id;    // ✅ correctly extract userId


 const user = await userModel.findById(userId);
 if(!user){
    return res.json({success:false,message:"User is not Found"})
 }

 res.json({
    success:true,
     userData:{
       name: user.name,
       isAccountVerified: user.isAccountVerified,
       role:user.role,
       profileImageUrl:user.profileImageUrl
 }
})

 
}catch{
    return res.json({success:false, message:error.message});
    
}
}

