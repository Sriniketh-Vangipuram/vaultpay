import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../../models/User.js";

interface LoginInput{
    email:string;
    password:string;
}

interface AuthResult{
    token:string;
    user:{
        id:string;
        name:string;
        email:string;
        role:string;
        companyName?:string;
    };
}

export const loginUser=async(input:LoginInput,):Promise<AuthResult> => {

    const {email,password}=input;

    const user=await User.findOne({email}).select("+passwordHash");

    if(!user){
        throw new Error("Invalid email or password");
    }

    if(!user.isActive){
        throw new Error("Account is inactive");
    }

    const passwordMatches=await bcrypt.compare(
        password,
        user.passwordHash,
    );

    if(!passwordMatches){
        throw new Error("Invalid email or password");
    }

    const jwtSecret=process.env.JWT_SECRET;

    if(!jwtSecret){
        throw new Error("JWT_SECRET is not configured");
    }

    const token=jwt.sign(
        {
            sub:user._id.toString(),
            role:user.role,
        },

        jwtSecret,
        {
            expiresIn:"1h",
        },
    );


    return {
        token,
        user:{
            id:user._id.toString(),
            name:user.name,
            email:user.email,
            role:user.role,
            companyName:user.companyName,
        },
    };
};