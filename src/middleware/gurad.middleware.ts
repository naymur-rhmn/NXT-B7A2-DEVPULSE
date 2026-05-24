import type { NextFunction, Request, Response } from "express";
import config from "../config";
import { USER_ROLE } from "../types";
import jwtVerify from "../utility/jwtVerify";

const guard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization;
 
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    const decoded = jwtVerify(token, config.jwt_secret as string); 

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

 
    if (decoded.role !== USER_ROLE.maintainer) {
      return res.status(403).json({
        success: false,
        message: "Only maintainer can delete issue",
      });
    }

    next();
  } catch (err) {
    next(err)
  }
};

export default guard;

// import type { NextFunction, Request, Response } from "express"; 
// import config from "../config";
// import { USER_ROLE } from "../types";
// import jwtVerify from "../utility/jwtVerify";

// const guard = async (req: Request, res: Response, next: NextFunction) => {
//     try { 
//         const token = req.headers.authorization;

//         if(!token) {
//             throw new Error("token undefined")
//         }

//         const decoded = jwtVerify(token as string, config.jwt_secret as string)

//         if(!decoded) {
//             throw new Error("unauthorized")
//         }
    
//         if(!(decoded.role === USER_ROLE.maintainer)) {
//             throw new Error("unauthorized")
//         }

//         next()
//     } catch (error) {
//         next(error);
//     }
// }

// export default guard;