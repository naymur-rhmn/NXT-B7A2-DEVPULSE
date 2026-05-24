
import jwt, { type JwtPayload } from "jsonwebtoken";

const jwtVerify = (token: string, secret: string) =>{
   return jwt.verify( token as string, secret as string ) as JwtPayload;
}

export default jwtVerify