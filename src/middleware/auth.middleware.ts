import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db"; 
import { type ROLES } from "../types";

const auth = (...roles: ROLES[] ) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {

      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!",
        });
      }

      const decoded = jwt.verify( token, config.jwt_secret as string ) as JwtPayload;
      

      const result = await pool.query(`
        SELECT id, name,  email, role FROM users WHERE id=$1
        `, [decoded.id]);

      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found!",
        });
      }


      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden access!",
        });
      }

      req.user = user;

      next();
      
    } catch (error) {
      next(error);
    }
  };
};

export default auth;