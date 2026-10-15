"use strict";
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const handlers = {
  "/api/admin": require("./api/admin"),
  "/api/catalog": require("./api/catalog"),
  "/api/config": require("./api/config"),
  "/api/plans": require("./api/plans"),
};
const types = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".ico":"image/x-icon",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp"};
function send(res,status,body,headers={}) {
  if(res.writableEnded)return;
  res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff",...headers});
  res.end(typeof body==="string"?body:JSON.stringify(body));
}
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,"http://localhost");
    const route=url.pathname.replace(/\/$/,"")||"/";
    if(route==="/health")return send(res,200,{ok:true});
    if(handlers[route]){
      if(!["GET","POST","PATCH"].includes(req.method))return send(res,405,{error:"method not allowed"});
      let body={};
      if(req.method!=="GET"){
        const chunks=[];let size=0;
        for await(const chunk of req){
          size+=chunk.length;
          if(size>1024*1024)return send(res,413,{error:"request too large"});
          chunks.push(chunk);
        }
        try{body=JSON.parse(Buffer.concat(chunks).toString("utf8")||"{}");}
        catch{return send(res,400,{error:"invalid JSON"});}
      }
      const response={
        status(code){this.statusCode=code;return this;},
        setHeader(name,value){res.setHeader(name,value);return this;},
        json(value){send(res,this.statusCode||200,value);},
        send(value){if(res.writableEnded)return;res.statusCode=this.statusCode||200;res.end(value);},
        statusCode:200,
      };
      const request={method:req.method,headers:req.headers,body,query:Object.fromEntries(url.searchParams)};
      return await handlers[route](request,response);
    }
    if(req.method!=="GET"&&req.method!=="HEAD")return send(res,405,{error:"method not allowed"});
    let pathname;
    try{pathname=decodeURIComponent(url.pathname);}
    catch{return send(res,400,{error:"bad path"});}
    if(pathname==="/")pathname="/index.html";
    const segments=pathname.split("/");
    if(segments.some(x=>x===".."||x.startsWith("."))||pathname.startsWith("/api/")||pathname==="/server.js"||pathname==="/Dockerfile"||pathname==="/compose.yaml"||pathname==="/package.json")
      return send(res,404,{error:"not found"});
    const file=path.resolve(root,"."+pathname);
    if(!file.startsWith(root+path.sep))return send(res,404,{error:"not found"});
    const ext=path.extname(file).toLowerCase();
    if(!types[ext])return send(res,404,{error:"not found"});
    try{
      const data=await fs.readFile(file);
      res.writeHead(200,{"Content-Type":types[ext],"X-Content-Type-Options":"nosniff","Cache-Control":"no-cache"});
      res.end(req.method==="HEAD"?undefined:data);
    }catch(e){return send(res,e.code==="ENOENT"?404:500,{error:"not found"});}
  }catch(e){console.error(e);if(!res.headersSent)send(res,500,{error:"internal server error"});else res.end();}
});
server.listen(port,"0.0.0.0",()=>console.log("SPIXD equipment check listening on "+port));
