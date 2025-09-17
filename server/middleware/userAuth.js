import jwt from "jsonwebtoken";

const userAuth = async (req,res,next)=>{
 const {token} =req.cookies;
 if(!token){
    return res.json({success:false,message:"Not authorized. Login Again"})
 }

 try{
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)
    if(tokenDecode.id){
      req.user = { 
         id: tokenDecode.id || tokenDecode.userId,
        
      
      }; 
        return next();
    }else{
        return res.json({success:false,message:"Not authorized. Login Again" })
    }
    
 }catch(error){
    return res.json({success:false, message:error.message})
 }
}


export default userAuth;
