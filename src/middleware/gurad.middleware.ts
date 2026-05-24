import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { USER_ROLE } from "../types";

const guard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id} = req.params; 
        const token = req.headers.authorization;

        if(!token) {
            throw new Error("token undefined")
        }

        const decoded = jwt.verify( token as string, config.jwt_secret as string ) as JwtPayload;

        if(!decoded) {
            throw new Error("unauthorized")
        }
    
        if(decoded.role === USER_ROLE.maintainer) {
            return next();
        }


    } catch (error) {
        next(error);
    }
}

export default guard;