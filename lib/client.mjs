export const API_URL='https://mcp.wordsintomusic.com/v1';
export const keyPattern=/^wim_[a-f0-9]{64}$/;
export class MusicClient {
 constructor(key,{fetch:transport=globalThis.fetch}={}) {if(!keyPattern.test(key||''))throw Error('Provide a valid API key with wim login --key-stdin or WIM_API_KEY.');this.key=key;this.transport=transport;}
 async request(path,{method='GET',body}={}) {
  let res;
  try {res=await this.transport(API_URL+path,{method,headers:{Authorization:`Bearer ${this.key}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(30000)});}
  catch {throw Error('Network request failed. If starting a song, retry the SAME prepared request ID. Do not prepare a second song.');}
  let data;try {data=await res.json();}catch {throw Error('The API returned an unreadable response. Retry using the same request ID.');}
  if(!res.ok) {
   const supplied=data?.error?.code;
   const code=typeof supplied==='string'&&/^[A-Z_0-9]{1,40}$/.test(supplied)?supplied:`HTTP_${res.status}`;
   const messages={UNAUTHORIZED:'The API key is invalid, expired, revoked or lacks permission.',RATE_LIMIT:'Too many requests. Wait one minute before retrying.',REQUEST_CONFLICT:'This request ID was used for another brief. Use a new ID for a different song.',PREPARATION_EXPIRED:'The preparation expired. Prepare it again with a new request ID.',INVALID_INPUT:'Check the input file against the API documentation.',SONG_LIMIT:'Your account has reached a song-generation limit.'};
   throw Error(`${code}: ${messages[code] || 'Request failed. Check your account and retry with the same request ID.'}`);
  }
  return data;
 }
 account(){return this.request('/account');}
 prepare(body){return this.request('/songs/prepare',{method:'POST',body});}
 start(id){return this.request('/songs/start',{method:'POST',body:{preparedRequestId:id}});}
 job(id){return this.request(`/jobs/${encodeURIComponent(id)}`);}
 songs({limit,cursor}={}){const query=new URLSearchParams();if(limit!==undefined)query.set('limit',String(limit));if(cursor)query.set('cursor',cursor);return this.request('/songs'+(query.size?'?'+query:''));}
 song(id,includeLyrics=false){return this.request(`/songs/${encodeURIComponent(id)}${includeLyrics?'?includeLyrics=true':''}`);}
}
