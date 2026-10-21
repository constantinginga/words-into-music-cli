#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {readFile} from 'node:fs/promises';
import {MusicClient} from '../lib/client.mjs';
import {saveKey,loadKey,removeKey} from '../lib/credentials.mjs';
const help=`Words into Music CLI

Sign up: https://wordsintomusic.com/create/
Create an API key: https://wordsintomusic.com/app/settings/
Docs: https://wordsintomusic.com/developers/

wim login --key-stdin            Read a key from stdin; verify and save it privately
wim logout                      Remove the locally saved key; revoke in app Settings
wim account                     Available song credits
wim prepare --file brief.json    Validate a brief without spending credits
wim start ID --confirm           Start a preparation, using ONE existing song credit
wim job ID                      Check progress; poll at least 15 seconds apart
wim songs [--limit 10] [--cursor CURSOR]
wim song ID [--include-lyrics]

All API results are JSON. WIM_API_KEY overrides the saved key. Never put keys in
command arguments, source code or URLs. A timeout is not a reason to prepare a
second song. Retry start with the SAME preparation ID. No automatic purchases.
`;
async function main(){
 const {values,positionals}=parseArgs({options:{help:{type:'boolean',short:'h'},version:{type:'boolean'},'key-stdin':{type:'boolean'},file:{type:'string'},confirm:{type:'boolean'},limit:{type:'string'},cursor:{type:'string'},'include-lyrics':{type:'boolean'}},allowPositionals:true,strict:true});
 const [command,id,...extra]=positionals;
 if(values.version){console.log('1.0.0');return;}
 if(values.help||!command){console.log(help);return;}
 if(extra.length)throw Error('Too many arguments. Run wim --help.');
 if(command==='logout'){if(id)throw Error('Unexpected argument.');await removeKey();console.log('Local API key removed. Revoke the key in app Settings to disable it everywhere.');return;}
 if(command==='login'){
  if(!values['key-stdin']||process.stdin.isTTY)throw Error('Use wim login --key-stdin and pass the key through stdin.');
  let key='';for await(const chunk of process.stdin){key+=chunk;if(key.length>200)throw Error('Invalid API key.');}key=key.trim();
  await new MusicClient(key).account();await saveKey(key);console.log('API key verified and saved.');return;
 }
 if(!['account','prepare','start','job','songs','song'].includes(command))throw Error('Unknown command. Run wim --help.');
 const client=new MusicClient(process.env.WIM_API_KEY || await loadKey());let result;
 if(command==='account'){if(id)throw Error('Unexpected argument.');result=await client.account();}
 if(command==='prepare'){if(!values.file||id)throw Error('Use wim prepare --file brief.json. Include a stable requestId in the JSON.');const text=await readFile(values.file,'utf8');if(Buffer.byteLength(text)>24000)throw Error('Brief file exceeds 24,000 bytes.');result=await client.prepare(JSON.parse(text));}
 if(command==='start'){if(!id||!values.confirm)throw Error('Use wim start PREPARATION_ID --confirm. This uses ONE existing song credit.');result=await client.start(id);}
 if(command==='job'){if(!id)throw Error('Provide a job ID.');result=await client.job(id);}
 if(command==='song'){if(!id)throw Error('Provide a song ID.');result=await client.song(id,values['include-lyrics']);}
 if(command==='songs'){if(id)throw Error('Unexpected argument.');if(values.limit && !/^(?:[1-9]|1[0-9]|20)$/.test(values.limit))throw Error('Limit must be from 1 to 20.');result=await client.songs(values);}
 console.log(JSON.stringify(result,null,2));
}
main().catch(error=>{console.error(error instanceof SyntaxError?'Invalid JSON file.':error.message);process.exitCode=1;});
