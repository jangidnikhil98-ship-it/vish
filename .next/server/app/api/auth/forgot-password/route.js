"use strict";(()=>{var a={};a.id=7556,a.ids=[7556],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1932:a=>{a.exports=require("url")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4573:a=>{a.exports=require("node:buffer")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},14985:a=>{a.exports=require("dns")},19771:a=>{a.exports=require("process")},20424:(a,b,c)=>{c.d(b,{BE:()=>m,EU:()=>p,Er:()=>l,SN:()=>s,aP:()=>q,jw:()=>n,lx:()=>o,pQ:()=>r});var d=c(34013),e=c(86935),f=c(69614),g=c(65573),h=c(77598),i=c.n(h);let j="vish_session";function k(){let a=process.env.AUTH_SECRET;if(!a||a.length<16)throw Error("AUTH_SECRET is missing or too short. Add a long random value to .env. Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"");return new TextEncoder().encode(a)}async function l(a){return d.Ay.hash(a,12)}async function m(a,b){return!!b&&d.Ay.compare(a,b)}async function n(a){let b=await new e.P({email:a.email}).setProtectedHeader({alg:"HS256"}).setSubject(String(a.sub)).setIssuedAt().setExpirationTime("30d").sign(k());(await (0,g.UL)()).set(j,b,{httpOnly:!0,secure:!0,sameSite:"lax",path:"/",maxAge:2592e3})}async function o(){(await (0,g.UL)()).delete(j)}async function p(){let a=await (0,g.UL)(),b=a.get(j)?.value;if(!b)return null;try{let{payload:a}=await (0,f.V)(b,k());if(!a.sub)return null;return{sub:Number(a.sub),email:"string"==typeof a.email?a.email:""}}catch{return null}}function q(){let a=i().randomBytes(32).toString("base64url"),b=i().createHash("sha256").update(a).digest("hex");return{token:a,hash:b}}function r(a){return i().createHash("sha256").update(a).digest("hex")}function s(a){if(!a)return!0;let b=a.getTime()+36e5;return Date.now()>b}},21820:a=>{a.exports=require("os")},27910:a=>{a.exports=require("stream")},28354:a=>{a.exports=require("util")},29021:a=>{a.exports=require("fs")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{a.exports=require("path")},34631:a=>{a.exports=require("tls")},37108:(a,b,c)=>{c.d(b,{J1:()=>u,k9:()=>s,v4:()=>r,vJ:()=>t});var d=c(35924);let e="Vishwakarma Gifts",f="#603813",g="#fdf7ef",h="rgba(96, 56, 19, 0.12)",i="https://vishwakarmagifts.com".replace(/\/$/,""),j=process.env.ADMIN_EMAIL??"",k=process.env.ADMIN_PHONE??"+91 8824942813",l=null;async function m(a){let b,c,f,g,h=(b=process.env.SMTP_HOST,c=Number(process.env.SMTP_PORT??587),f=process.env.SMTP_USER,g=process.env.SMTP_PASS,b&&f&&g?(l||(l=d.createTransport({host:b,port:c,secure:465===c,auth:{user:f,pass:g}})),l):null);if(!h)return void console.info("[email] SMTP not configured — skipping email",JSON.stringify({to:a.to,subject:a.subject}));try{let b=await h.sendMail({from:process.env.SMTP_FROM??`"${e}" <${process.env.SMTP_USER??"noreply@example.com"}>`,to:a.to,subject:a.subject,html:a.html,text:a.text??n(a.html),replyTo:a.replyTo});console.info("[email] sent",JSON.stringify({to:a.to,subject:a.subject,messageId:b.messageId}))}catch(a){console.error("[email] send failed:",a)}}let n=a=>a.replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(),o=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),p=a=>new Intl.NumberFormat("en-IN",{minimumFractionDigits:2}).format(a);function q(a){return`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${o(a.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f1e7;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#2c1c0a;">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:0;mso-hide:all;">${o(a.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;background:#ffffff;border:1px solid ${h};border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:${f};padding:22px 28px;color:#fff;font-family:'Libre Bodoni',Georgia,serif;font-size:22px;font-weight:600;">
              ${o(e)}
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 14px;font-family:'Libre Bodoni',Georgia,serif;font-size:24px;color:${f};font-weight:600;">
                ${o(a.title)}
              </h1>
              ${a.body}
              ${a.cta?`<p style="margin:24px 0 0;text-align:center;">
                      <a href="${o(a.cta.url)}"
                        style="display:inline-block;background:${f};color:#fff;text-decoration:none;font-weight:500;
                        padding:12px 24px;border-radius:8px;font-size:15px;">
                        ${o(a.cta.label)}
                      </a>
                    </p>`:""}
            </td>
          </tr>
          <tr>
            <td style="background:${g};padding:18px 28px;font-size:12px;color:#6b5a45;text-align:center;border-top:1px solid ${h};">
              You're receiving this email because you placed an order or signed up at
              <a href="${i}" style="color:${f};text-decoration:none;">${o(e)}</a>.
              <br />Need help? Reply to this email or WhatsApp us at <strong>${o(k)}</strong>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`}async function r(a){let b=q({preheader:`Welcome to ${e} — happy to have you!`,title:`Welcome to ${e}!`,body:`
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Hi ${o(a.firstName)},
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Thank you for creating your account. We craft personalised wooden gifts
        with love — engraved photo frames, plaques, name boards, keychains and
        more — perfect for every special occasion.
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Browse our latest collection and let us help you create memories that last.
      </p>
    `,cta:{label:"Start shopping",url:`${i}/products`}});await m({to:a.to,subject:`Welcome to ${e}!`,html:b})}async function s(a){let b=a.items.map(a=>`
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid ${h};font-size:14px;">
            <strong>${o(a.name)}</strong>
            ${a.size?`<div style="color:#6b5a45;font-size:12px;">Size: ${o(a.size)}</div>`:""}
            ${"yes"===a.giftWrap?`<div style="color:${f};font-size:12px;">🎁 Gift wrapped</div>`:""}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid ${h};font-size:14px;text-align:center;">
            ${a.quantity}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid ${h};font-size:14px;text-align:right;">
            ₹${p(a.price*a.quantity)}
          </td>
        </tr>`).join(""),c=a.shipping?`
      <h3 style="margin:24px 0 8px;font-size:15px;color:${f};">Shipping to</h3>
      <div style="background:${g};border:1px solid ${h};border-radius:10px;padding:14px;font-size:14px;line-height:1.6;">
        <strong>${o(a.customerName)}</strong><br />
        ${[a.shipping.apartment,a.shipping.address,a.shipping.city,a.shipping.state,a.shipping.pincode].filter(Boolean).map(o).join(", ")}
        ${a.shipping.phone?`<br />📞 ${o(a.shipping.phone)}`:""}
      </div>`:"",d=q({preheader:`Order ${a.orderNumber} confirmed — total ₹${p(a.totalAmount)}`,title:"Thank you — your order is confirmed!",body:`
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Hi ${o(a.customerName)},
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        We've received your order and will start crafting it with love.
        Here are the details:
      </p>

      <div style="background:${g};border:1px solid ${h};border-radius:10px;padding:14px 16px;font-size:14px;margin-bottom:16px;">
        <div><strong>Order number:</strong> ${o(a.orderNumber)}</div>
        ${a.paymentId?`<div><strong>Payment ID:</strong> ${o(a.paymentId)}</div>`:""}
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border-collapse:collapse;border:1px solid ${h};border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:${g};color:${f};">
            <th align="left" style="padding:10px 12px;font-size:12px;text-transform:uppercase;">Item</th>
            <th align="center" style="padding:10px 12px;font-size:12px;text-transform:uppercase;">Qty</th>
            <th align="right" style="padding:10px 12px;font-size:12px;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${b}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" align="right" style="padding:14px 12px;font-size:15px;border-top:2px solid ${h};">
              <strong>Grand total</strong>
            </td>
            <td align="right" style="padding:14px 12px;font-size:15px;border-top:2px solid ${h};">
              <strong>₹${p(a.totalAmount)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      ${c}

      <p style="font-size:14px;line-height:1.6;color:#6b5a45;margin:18px 0 0;">
        We'll notify you again once your order ships. If anything looks off,
        just reply to this email and we'll sort it out.
      </p>
    `,cta:{label:"Track my order",url:`${i}/dashboard/orders`}});await m({to:a.to,subject:`Order Confirmed — ${a.orderNumber}`,html:d})}async function t(a){if(!j)return void console.info("[email] ADMIN_EMAIL not set — skipping admin notification");let b=a.items.map(a=>`
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid ${h};font-size:13px;">
            ${o(a.name)}${a.size?` (${o(a.size)})`:""}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid ${h};font-size:13px;text-align:center;">
            ${a.quantity}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid ${h};font-size:13px;text-align:right;">
            ₹${p(a.price*a.quantity)}
          </td>
        </tr>`).join(""),c=a.shipping?`
      <p style="margin:16px 0 4px;font-size:13px;color:${f};font-weight:600;">Ship to:</p>
      <div style="background:${g};border:1px solid ${h};border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.55;">
        ${o(a.customerName)}<br />
        ${[a.shipping.apartment,a.shipping.address,a.shipping.city,a.shipping.state,a.shipping.pincode].filter(Boolean).map(o).join(", ")}
        ${a.shipping.phone?`<br />📞 ${o(a.shipping.phone)}`:""}
      </div>`:"",d=q({preheader:`🎉 New order ${a.orderNumber} — ₹${p(a.totalAmount)} from ${a.customerName}`,title:`🎉 New order received!`,body:`
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        A new paid order just landed. Quick summary:
      </p>

      <div style="background:${g};border:1px solid ${h};border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.7;margin-bottom:14px;">
        <div><strong>Order:</strong> ${o(a.orderNumber)}</div>
        <div><strong>Total:</strong> ₹${p(a.totalAmount)}</div>
        <div><strong>Customer:</strong> ${o(a.customerName)}</div>
        <div><strong>Email:</strong> ${o(a.customerEmail)}</div>
        ${a.customerPhone?`<div><strong>Phone:</strong> ${o(a.customerPhone)}</div>`:""}
        ${a.paymentId?`<div><strong>Payment ID:</strong> ${o(a.paymentId)}</div>`:""}
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border-collapse:collapse;border:1px solid ${h};border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:${g};color:${f};">
            <th align="left" style="padding:8px 12px;font-size:11px;text-transform:uppercase;">Item</th>
            <th align="center" style="padding:8px 12px;font-size:11px;text-transform:uppercase;">Qty</th>
            <th align="right" style="padding:8px 12px;font-size:11px;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${b}</tbody>
      </table>

      ${c}
    `,cta:a.adminUrl?{label:"Open in admin",url:a.adminUrl}:void 0});await m({to:j,subject:`🎉 New order ${a.orderNumber} — ₹${p(a.totalAmount)}`,html:d,replyTo:a.customerEmail})}async function u(a){let b=q({preheader:"Reset your password",title:"Reset your password",body:`
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        Hi ${o(a.firstName)},
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
        We received a request to reset your password. Click the button below
        to set a new one — this link will expire in 60 minutes.
      </p>
      <p style="font-size:13px;line-height:1.55;color:#6b5a45;margin:0 0 12px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `,cta:{label:"Reset password",url:a.resetUrl}});await m({to:a.to,subject:`Reset your ${e} password`,html:b})}},38690:(a,b,c)=>{c.d(b,{E9:()=>j,X5:()=>h,oW:()=>k,zK:()=>i});var d=c(74443);let e=d.YjP({message:"Please enter an email"}).trim().min(1,"Please enter an email").email("Please enter a valid email address").max(255).transform(a=>a.toLowerCase()),f=d.YjP({message:"Please enter a password"}).min(8,"Your password must be at least 8 characters long").max(72),g=d.YjP().trim().min(1).max(100),h=d.Ikc({email:e,password:d.YjP({message:"Please enter a password"}).min(1,"Please enter a password").max(72)}),i=d.Ikc({first_name:g.refine(a=>a.length>0,{message:"Please enter your first name"}),last_name:g.refine(a=>a.length>0,{message:"Please enter your last name"}),email:e,password:f}),j=d.Ikc({email:e}),k=d.Ikc({token:d.YjP().trim().min(10,"Invalid or expired reset link"),password:f,repeatPassword:f}).refine(a=>a.password===a.repeatPassword,{message:"Passwords do not match",path:["repeatPassword"]})},41204:a=>{a.exports=require("string_decoder")},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},53053:a=>{a.exports=require("node:diagnostics_channel")},55511:a=>{a.exports=require("crypto")},55591:a=>{a.exports=require("https")},58691:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>J,patchFetch:()=>I,routeModule:()=>E,serverHooks:()=>H,workAsyncStorage:()=>F,workUnitAsyncStorage:()=>G});var d={};c.r(d),c.d(d,{POST:()=>D,dynamic:()=>C,runtime:()=>B});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(61564),x=c(20424),y=c(37108),z=c(88831),A=c(38690);let B="nodejs",C="force-dynamic";async function D(a){try{let b=await a.json().catch(()=>({})),c=A.E9.safeParse(b);if(!c.success){let a=c.error.flatten().fieldErrors;return v.NextResponse.json({success:!1,message:"Validation failed",errors:a},{status:422})}let{email:d}=c.data,e=await (0,z.ht)(d);if(e&&1===Number(e.is_active)){let{token:a,hash:b}=(0,x.aP)();await (0,z.HG)({email:e.email,tokenHash:b});let c=`https://vishwakarmagifts.com/reset-password/${encodeURIComponent(a)}?email=${encodeURIComponent(e.email)}`;try{await (0,y.J1)({to:e.email,firstName:e.first_name,resetUrl:c})}catch(a){console.warn("[forgot-password] failed to send email:",a)}}return v.NextResponse.json({success:!0,message:"If an account exists for that email, we've sent a password reset link."})}catch(a){return(0,w.H)(a)}}let E=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/auth/forgot-password/route",pathname:"/api/auth/forgot-password",filename:"route",bundlePath:"app/api/auth/forgot-password/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"E:\\vish-main\\vish-main\\app\\api\\auth\\forgot-password\\route.ts",nextConfigOutput:"",userland:d,...{}}),{workAsyncStorage:F,workUnitAsyncStorage:G,serverHooks:H}=E;function I(){return(0,g.patchFetch)({workAsyncStorage:F,workUnitAsyncStorage:G})}async function J(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),E.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/auth/forgot-password/route";"/index"===d&&(d="/");let e=await E.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,params:v,nextConfig:w,parsedUrl:x,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D,clientReferenceManifest:F,serverActionsManifest:G}=e,H=(0,k.normalizeAppPath)(d),I=!!(z.dynamicRoutes[H]||z.routes[D]),J=async()=>((null==A?void 0:A.render404)?await A.render404(a,b,x,!1):b.end("This page could not be found"),null);if(I&&!y){let a=!!z.routes[D],b=z.dynamicRoutes[H];if(b&&!1===b.fallback&&!a){if(w.adapterPath)return await J();throw new t.NoFallbackError}}let K=null;!I||E.isDev||y||(K="/index"===(K=D)?"/":K);let L=!0===E.isDev||!I,M=I&&!L;G&&F&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:F,serverActionsManifest:G});let N=a.method||"GET",O=(0,i.getTracer)(),P=O.getActiveScopeSpan(),Q=!!(null==A?void 0:A.isWrappedByNextServer),R=!!(0,h.getRequestMeta)(a,"minimalMode"),S=(0,h.getRequestMeta)(a,"incrementalCache")||await E.getIncrementalCache(a,w,z,R);null==S||S.resetRequestCache(),globalThis.__incrementalCache=S;let T={params:v,previewProps:z.preview,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:L,incrementalCache:S,cacheLifeProfiles:w.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>E.onRequestError(a,b,d,e,A)},sharedContext:{buildId:g}},U=new l.NodeNextRequest(a),V=new l.NodeNextResponse(b),W=m.NextRequestAdapter.fromNodeNextRequest(U,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>E.handle(W,T).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=O.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${N} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${N} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!R&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=T.renderOpts.fetchMetrics;let h=T.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=T.renderOpts.collectedTags;if(!I)return await (0,p.I)(U,V,d,T.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==T.renderOpts.collectedRevalidate&&!(T.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&T.renderOpts.collectedRevalidate,e=void 0===T.renderOpts.collectedExpire||T.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:T.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await E.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:B})},!1,A),b}},k=await E.handleResponse({req:a,nextConfig:w,cacheKey:K,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:R});if(!I)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});R||b.setHeader("x-nextjs-cache",B?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return R&&I||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(U,V,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};Q&&P?await h(P):(e=O.getActiveScopeSpan(),await O.withPropagatedContext(a.headers,()=>O.trace(n.BaseServerSpan.handleRequest,{spanName:`${N} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":N,"http.target":a.url}},h),void 0,!Q))}catch(b){if(b instanceof t.NoFallbackError||await E.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:B})},!1,A),I)throw b;return await (0,p.I)(U,V,new Response(null,{status:500})),null}}},61564:(a,b,c)=>{c.d(b,{H:()=>h,f:()=>g,ok:()=>f});var d=c(23211),e=c(74443);function f(a,b){let c=new Headers({"Content-Type":"application/json"});return b?.cacheSeconds?c.set("Cache-Control",`public, s-maxage=${b.cacheSeconds}, stale-while-revalidate=${b.staleSeconds??b.cacheSeconds}`):c.set("Cache-Control","no-store"),new d.NextResponse(JSON.stringify({success:!0,data:a}),{status:b?.status??200,headers:c})}function g(a,b=400,c){return d.NextResponse.json({success:!1,message:a,...c},{status:b,headers:{"Cache-Control":"no-store"}})}function h(a){return a instanceof e.GaX?g("Validation failed",422,{errors:a.flatten().fieldErrors}):a instanceof Error?(console.error("[API]",a.message,a.stack),g(a.message||"Server error",500)):(console.error("[API] unknown error",a),g("Server error",500))}},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:a=>{a.exports=require("timers")},74075:a=>{a.exports=require("zlib")},77598:a=>{a.exports=require("node:crypto")},78474:a=>{a.exports=require("node:events")},79428:a=>{a.exports=require("buffer")},79646:a=>{a.exports=require("child_process")},81630:a=>{a.exports=require("http")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},88831:(a,b,c)=>{c.d(b,{El:()=>n,HG:()=>m,bH:()=>o,d6:()=>l,f3:()=>k,ht:()=>h,kg:()=>j,kl:()=>i});var d=c(34216),e=c(42294),f=c(44075),g=c(88820);async function h(a){return(await f.db.select({id:g.users.id,first_name:g.users.first_name,last_name:g.users.last_name,email:g.users.email,password:g.users.password,phone:g.users.phone,profile_img:g.users.profile_img,is_active:g.users.is_active,is_email_verify:g.users.is_email_verify,role:g.users.role}).from(g.users).where((0,d.Uo)((0,d.eq)(g.users.email,a.toLowerCase()),(0,d.kZ)(g.users.deleted_at))).limit(1))[0]??null}async function i(a){return(await f.db.select({id:g.users.id,first_name:g.users.first_name,last_name:g.users.last_name,email:g.users.email,phone:g.users.phone,profile_img:g.users.profile_img,is_active:g.users.is_active,is_email_verify:g.users.is_email_verify,role:g.users.role}).from(g.users).where((0,d.Uo)((0,d.eq)(g.users.id,a),(0,d.kZ)(g.users.deleted_at))).limit(1))[0]??null}async function j(a){let b=await f.db.insert(g.users).values({first_name:a.first_name,last_name:a.last_name,email:a.email.toLowerCase(),password:a.passwordHash,is_active:1,is_email_verify:1,created_at:(0,e.ll)`CURRENT_TIMESTAMP`,updated_at:(0,e.ll)`CURRENT_TIMESTAMP`});return Number(b[0]?.insertId??b.insertId)}async function k(a){await f.db.update(g.users).set({password:a.passwordHash,updated_at:(0,e.ll)`CURRENT_TIMESTAMP`}).where((0,d.eq)(g.users.id,a.userId))}async function l(a){await f.db.update(g.users).set({last_login_at:(0,e.ll)`CURRENT_TIMESTAMP`}).where((0,d.eq)(g.users.id,a))}async function m(a){let b=a.email.toLowerCase();(await f.db.select({email:g.passwordResetTokens.email}).from(g.passwordResetTokens).where((0,d.eq)(g.passwordResetTokens.email,b)).limit(1)).length>0?await f.db.update(g.passwordResetTokens).set({token:a.tokenHash,created_at:(0,e.ll)`CURRENT_TIMESTAMP`}).where((0,d.eq)(g.passwordResetTokens.email,b)):await f.db.insert(g.passwordResetTokens).values({email:b,token:a.tokenHash,created_at:(0,e.ll)`CURRENT_TIMESTAMP`})}async function n(a){return(await f.db.select({email:g.passwordResetTokens.email,token:g.passwordResetTokens.token,created_at:g.passwordResetTokens.created_at}).from(g.passwordResetTokens).where((0,d.eq)(g.passwordResetTokens.token,a)).limit(1))[0]??null}async function o(a){await f.db.delete(g.passwordResetTokens).where((0,d.eq)(g.passwordResetTokens.email,a.toLowerCase()))}},91645:a=>{a.exports=require("net")},94735:a=>{a.exports=require("events")}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,4109,5592,5440,4443,4013,9663,5661],()=>b(b.s=58691));module.exports=c})();