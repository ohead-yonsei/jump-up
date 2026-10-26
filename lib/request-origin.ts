// Next.js can use an internal hostname in Request.url. Compare the browser's
// Origin to the public Host and protocol supplied by the deployment proxy.
export function isSameOrigin(request:Request):boolean {
 const origin=request.headers.get('origin');
 if(!origin)return false;
 const url=new URL(request.url);
 const host=request.headers.get('host')??url.host;
 const protocol=request.headers.get('x-forwarded-proto')??url.protocol.slice(0,-1);
 if(protocol!=='http'&&protocol!=='https')return false;
 return origin===`${protocol}://${host}`;
}
