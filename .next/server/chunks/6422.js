"use strict";exports.id=6422,exports.ids=[6422],exports.modules={37108:(a,b,c)=>{c.d(b,{J1:()=>u,k9:()=>s,v4:()=>r,vJ:()=>t});var d=c(35924);let e="Vishwakarma Gifts",f="#603813",g="#fdf7ef",h="rgba(96, 56, 19, 0.12)",i="https://vishwakarmagifts.com".replace(/\/$/,""),j=process.env.ADMIN_EMAIL??"",k=process.env.ADMIN_PHONE??"+91 8824942813",l=null;async function m(a){let b,c,f,g,h=(b=process.env.SMTP_HOST,c=Number(process.env.SMTP_PORT??587),f=process.env.SMTP_USER,g=process.env.SMTP_PASS,b&&f&&g?(l||(l=d.createTransport({host:b,port:c,secure:465===c,auth:{user:f,pass:g}})),l):null);if(!h)return void console.info("[email] SMTP not configured — skipping email",JSON.stringify({to:a.to,subject:a.subject}));try{let b=await h.sendMail({from:process.env.SMTP_FROM??`"${e}" <${process.env.SMTP_USER??"noreply@example.com"}>`,to:a.to,subject:a.subject,html:a.html,text:a.text??n(a.html),replyTo:a.replyTo});console.info("[email] sent",JSON.stringify({to:a.to,subject:a.subject,messageId:b.messageId}))}catch(a){console.error("[email] send failed:",a)}}let n=a=>a.replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(),o=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),p=a=>new Intl.NumberFormat("en-IN",{minimumFractionDigits:2}).format(a);function q(a){return`<!doctype html>
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
    `,cta:{label:"Reset password",url:a.resetUrl}});await m({to:a.to,subject:`Reset your ${e} password`,html:b})}},46422:(a,b,c)=>{c.r(b),c.d(b,{POST:()=>v,dynamic:()=>t,notifyOrderPaid:()=>w,runtime:()=>s});var d=c(61564),e=c(63920),f=c(7566),g=c(58376),h=c(37108);let i=(process.env.WHATSAPP_PROVIDER??"none").toLowerCase(),j=process.env.WHATSAPP_INSTANCE_ID??"",k=process.env.WHATSAPP_TOKEN??"",l=process.env.WHATSAPP_ADMIN_NUMBER??"";async function m(a,b){let c=`https://api.ultramsg.com/${j}/messages/chat`,d=new URLSearchParams({token:k,to:a,body:b}),e=await fetch(c,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:d.toString()});if(!e.ok){let a=await e.text().catch(()=>"");throw Error(`UltraMSG ${e.status}: ${a}`)}}async function n(a,b){let c=`https://api.green-api.com/waInstance${j}/sendMessage/${k}`,d=await fetch(c,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chatId:`${a}@c.us`,message:b})});if(!d.ok){let a=await d.text().catch(()=>"");throw Error(`GreenAPI ${d.status}: ${a}`)}}async function o(a){let b;if("none"===i||!j||!k)return void console.info("[whatsapp] not configured — would have sent",JSON.stringify({to:a.to,message:a.message.slice(0,80)}));let c=(b=a.to.replace(/\D/g,""))?b.startsWith("91")&&12===b.length?b:10===b.length?`91${b}`:b:"";if(!c)return void console.warn("[whatsapp] empty/invalid number, skipping");try{if("ultramsg"===i)await m(c,a.message);else{if("greenapi"!==i)return void console.warn(`[whatsapp] unknown provider: ${i}`);await n(c,a.message)}console.info("[whatsapp] sent to",c)}catch(a){console.error("[whatsapp] send failed:",a)}}let p=a=>new Intl.NumberFormat("en-IN",{minimumFractionDigits:2}).format(a);async function q(a){if(!l)return void console.info("[whatsapp] WHATSAPP_ADMIN_NUMBER not set — skipping admin alert");let b=[];for(let c of(b.push(`🎉 *New order received!*`),b.push(""),b.push(`*Order:* ${a.orderNumber}`),b.push(`*Total:* ₹${p(a.totalAmount)}`),b.push(`*Customer:* ${a.customerName}`),a.customerPhone&&b.push(`*Phone:* ${a.customerPhone}`),b.push(`*Email:* ${a.customerEmail}`),(a.shippingCity||a.shippingPincode)&&b.push(`*Ship to:* ${[a.shippingCity,a.shippingPincode].filter(Boolean).join(" - ")}`),b.push(""),b.push("*Items:*"),a.items))b.push(`• ${c.name}${c.size?` (${c.size})`:""} \xd7 ${c.quantity} — ₹${p(c.price*c.quantity)}`);b.push(""),b.push(`Open: ${"https://vishwakarmagifts.com".replace(/\/$/,"")}/admin/orders`),await o({to:l,message:b.join("\n")})}async function r(a){if(!a.to)return;let b=`Hi ${a.customerName}! 🎁

Your order *${a.orderNumber}* has been received successfully.
Total paid: *₹${p(a.totalAmount)}*

We're crafting your gift with love and will keep you posted.
Thank you for choosing Vishwakarma Gifts!`;await o({to:a.to,message:b})}let s="nodejs",t="force-dynamic",u="https://vishwakarmagifts.com".replace(/\/$/,"");async function v(a){try{let b=await a.json().catch(()=>null),c=e.zz.safeParse(b);if(!c.success)return(0,d.f)("Invalid payment payload",422,{errors:c.error.flatten().fieldErrors});let{razorpay_order_id:h,razorpay_payment_id:i,razorpay_signature:j}=c.data;if(!(0,g.s9)({razorpay_order_id:h,razorpay_payment_id:i,razorpay_signature:j}))return(0,d.f)("Payment signature verification failed",400);let k=await (0,g.TC)().payments.fetch(i);if("authorized"!==k.status&&"captured"!==k.status)return(0,d.f)(`Payment not successful (status=${k.status})`,400);let l=await (0,f.qd)({razorpayOrderId:h,razorpayPaymentId:i,rawPaymentJson:JSON.stringify(k)});if(!l)return(0,d.f)("Order record not found for this payment",404);return l.wasAlreadyPaid||w({orderId:l.orderId,razorpayPaymentId:i}),(0,d.ok)({orderId:l.orderId})}catch(a){return(0,d.H)(a)}}async function w(a){let b;try{b=await (0,f.DA)(a.orderId)}catch(a){console.error("[notify] failed to load order:",a);return}if(!b)return void console.warn("[notify] order not found for id",a.orderId);let c=b.items.map(a=>({name:a.name,quantity:a.quantity,price:a.price,size:a.size,variation:a.variation,giftWrap:a.giftWrap}));if(b.customerEmail)try{await (0,h.k9)({to:b.customerEmail,orderNumber:b.orderNumber,customerName:b.customerName,totalAmount:b.totalAmount,items:c,shipping:b.shipping,paymentId:a.razorpayPaymentId})}catch(a){console.error("[notify] customer email failed:",a)}try{await (0,h.vJ)({orderNumber:b.orderNumber,customerName:b.customerName,customerEmail:b.customerEmail,customerPhone:b.customerPhone,totalAmount:b.totalAmount,items:c,shipping:b.shipping,paymentId:a.razorpayPaymentId,adminUrl:`${u}/admin/orders`})}catch(a){console.error("[notify] admin email failed:",a)}try{await q({orderNumber:b.orderNumber,customerName:b.customerName,customerEmail:b.customerEmail,customerPhone:b.customerPhone,totalAmount:b.totalAmount,items:c,shippingCity:b.shipping?.city??null,shippingPincode:b.shipping?.pincode??null})}catch(a){console.error("[notify] admin WhatsApp failed:",a)}if(b.customerPhone)try{await r({to:b.customerPhone,orderNumber:b.orderNumber,customerName:b.customerName,totalAmount:b.totalAmount})}catch(a){console.error("[notify] customer WhatsApp failed:",a)}}}};