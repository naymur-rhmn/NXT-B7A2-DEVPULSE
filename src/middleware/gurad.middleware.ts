import type { NextFunction, Request, Response } from "express"; 
import config from "../config";
import { USER_ROLE } from "../types";
import jwtVerify from "../utility/jwtVerify";

const guard = async (req: Request, res: Response, next: NextFunction) => {
    try { 
        const token = req.headers.authorization;

        if(!token) {
            throw new Error("token undefined")
        }

        const decoded = jwtVerify(token as string, config.jwt_secret as string)

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