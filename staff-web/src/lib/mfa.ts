import {createCipheriv,createDecipheriv,createHmac,randomBytes,timingSafeEqual} from "node:crypto";
import {HttpError} from "./http";
const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function encodingKey():Buffer {
  const input=process.env.MFA_ENCRYPTION_KEY||"";
  if(!/^[a-f0-9]{64}$/i.test(input))throw new HttpError(503,"MFA_NOT_CONFIGURED","Authenticator encryption must be configured by the operator.");
  return Buffer.from(input,"hex");
}
export function generateMfaSecret():string{
  const bytes=randomBytes(20);
  let carry=0,bits=0,text="";
  for(const value of bytes){carry=(carry<<8)|value;bits+=8;while(bits>=5){bits-=5;text+=alphabet[(carry>>>bits)&31];}}
  if(bits>0)text+=alphabet[(carry<<(5-bits))&31];
  return text;
}
function decodeBase32(value:string):Buffer{
  let carry=0,bits=0;const result:number[]=[];
  for(const ch of value.toUpperCase().replace(/=+$/,"")){
    const digit=alphabet.indexOf(ch);if(digit<0)throw new Error("Invalid authenticator key.");
    carry=(carry<<5)|digit;bits+=5;
    if(bits>=8){bits-=8;result.push((carry>>>bits)&255);}
  }
  return Buffer.from(result);
}
export function encryptMfaSecret(value:string):string{
  const iv=randomBytes(12);
  const cipher=createCipheriv("aes-256-gcm",encodingKey(),iv);
  const ciphertext=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
  return [iv,cipher.getAuthTag(),ciphertext].map(x=>x.toString("base64url")).join(".");
}
export function decryptMfaSecret(value:string):string{
  const components=value.split(".");
  if(components.length!==3)throw new HttpError(503,"MFA_KEY_INVALID","Authenticator configuration needs administrator attention.");
  try{
    const [iv,tag,body]=components.map(x=>Buffer.from(x,"base64url"));
    const decipher=createDecipheriv("aes-256-gcm",encodingKey(),iv);decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body),decipher.final()]).toString("utf8");
  }catch{throw new HttpError(503,"MFA_KEY_INVALID","Authenticator configuration needs administrator attention.");}
}
function codeAt(secret:string,step:number){
  const count=Buffer.alloc(8);count.writeBigUInt64BE(BigInt(step));
  const digest=createHmac("sha1",decodeBase32(secret)).update(count).digest();
  const off=digest[digest.length-1]&0x0f;
  const value=(digest.readUInt32BE(off)&0x7fffffff)%1000000;
  return value.toString().padStart(6,"0");
}
export function verifyMfaCode(secret:string,code:string,now=Date.now()):number|null{
  if(!/^\d{6}$/.test(code))return null;
  const current=Math.floor(now/30000);
  for(const diff of [-1,0,1]){
    const step=current+diff;
    if(step<0)continue;
    const expected=codeAt(secret,step);
    if(timingSafeEqual(Buffer.from(expected),Buffer.from(code)))return step;
  }
  return null;
}
