if(!self.define){let e,s={};const l=(l,i)=>(l=new URL(l+".js",i).href,s[l]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=l,e.onload=s,document.head.appendChild(e)}else e=l,importScripts(l),s()})).then((()=>{let e=s[l];if(!e)throw new Error(`Module ${l} didn’t register its module`);return e})));self.define=(i,n)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let o={};const r=e=>l(e,t),m={module:{uri:t},exports:o,require:r};s[t]=Promise.all(i.map((e=>m[e]||r(e)))).then((e=>(n(...e),o)))}}define(["./workbox-6567b62a"],(function(e){"use strict";e.setCacheNameDetails({prefix:"sammelliste"}),self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"/sammelliste/css/app.8ddb729a.css",revision:null},{url:"/sammelliste/css/chunk-vendors.fed8d667.css",revision:null},{url:"/sammelliste/favicon.svg",revision:"858a16ae9cd708fd9ac3c55680227363"},{url:"/sammelliste/fonts/materialdesignicons-webfont.21f691f0.ttf",revision:null},{url:"/sammelliste/fonts/materialdesignicons-webfont.54b0f60d.woff2",revision:null},{url:"/sammelliste/fonts/materialdesignicons-webfont.5d875350.eot",revision:null},{url:"/sammelliste/fonts/materialdesignicons-webfont.d671cbf6.woff",revision:null},{url:"/sammelliste/index.html",revision:"d9282a2dd9c65a23259ea16a378ee47a"},{url:"/sammelliste/js/app.fc81021f.js",revision:null},{url:"/sammelliste/js/chunk-vendors.73d4d4e2.js",revision:null},{url:"/sammelliste/js/webfontloader.129e5673.js",revision:null},{url:"/sammelliste/manifest.json",revision:"0fd1572285a9749857d8e33529b05b61"},{url:"/sammelliste/robots.txt",revision:"b6216d61c03e6ce0c9aea6ca7808f7ca"}],{})}));
//# sourceMappingURL=service-worker.js.map
