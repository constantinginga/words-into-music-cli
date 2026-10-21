import {mkdir,writeFile,readFile,lstat,chmod,rename,unlink} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {keyPattern} from './client.mjs';
export const configDir=()=>join(homedir(),'.config','words-into-music');
async function safeDir(dir){await mkdir(dir,{recursive:true,mode:0o700});const s=await lstat(dir);if(s.isSymbolicLink()||!s.isDirectory())throw Error('Credential directory must be a real directory.');await chmod(dir,0o700);}
export async function saveKey(key,dir=configDir()) {
 if(!keyPattern.test(key))throw Error('Invalid API key.');await safeDir(dir);
 const target=join(dir,'credentials.json');
 try{if((await lstat(target)).isSymbolicLink())throw Error('Refusing to overwrite a credential symlink.');}catch(e){if(e.code!=='ENOENT')throw e;}
 const temporary=join(dir,`.credentials-${randomUUID()}.tmp`);
 await writeFile(temporary,JSON.stringify({apiKey:key})+'\n',{mode:0o600,flag:'wx'});
 try{await rename(temporary,target);}catch(e){await unlink(temporary).catch(()=>{});throw e;}
}
export async function loadKey(dir=configDir()){
 const target=join(dir,'credentials.json');
 try{const d=await lstat(dir),s=await lstat(target);if(d.isSymbolicLink()||s.isSymbolicLink()||!s.isFile()||(process.platform!=='win32'&&((d.mode&0o077)!==0||(s.mode&0o077)!==0)))throw Error('Credential file permissions must be private. Run wim logout, then log in again.');const value=JSON.parse(await readFile(target,'utf8'));return value.apiKey;}
 catch(e){if(e.code==='ENOENT')return undefined;throw e;}
}
export async function removeKey(dir=configDir()){try{await unlink(join(dir,'credentials.json'));}catch(e){if(e.code!=='ENOENT')throw e;}}
