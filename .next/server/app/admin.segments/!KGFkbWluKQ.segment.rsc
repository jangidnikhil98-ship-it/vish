1:"$Sreact.fragment"
2:I[7121,[],""]
3:I[4581,[],""]
4:I[2593,["8500","static/chunks/8500-3953cc33eeceb44e.js","6750","static/chunks/app/(site)/layout-4be4dec3e225f92f.js"],""]
:HL["/_next/static/css/dc0049391df53b19.css","style"]
:HL["https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@200;300;400;600;700;800;900&display=swap","style"]
:HL["https://fonts.googleapis.com/css?family=Roboto:300,300i,400,400i,500,500i,700,700i,900&display=swap","style"]
:HL["/backend/css/font-awesome.css","style"]
:HL["/backend/css/vendors/slick.css","style"]
:HL["/backend/css/vendors/slick-theme.css","style"]
:HL["/backend/css/vendors/scrollbar.css","style"]
:HL["/backend/css/vendors/select2.css","style"]
:HL["/backend/css/vendors/animate.css","style"]
:HL["/backend/css/vendors/datatables.css","style"]
:HL["/backend/css/vendors/owlcarousel.css","style"]
:HL["/backend/css/vendors/jsgrid.css","style"]
:HL["/backend/css/vendors/bootstrap.css","style"]
:HL["/backend/css/style.css","style"]
:HL["/backend/css/color-1.css","style",{"media":"screen"}]
:HL["/backend/css/responsive.css","style"]
:HL["/backend/css/developer.css","style"]
5:T49e,(function(){
  var sources = [
    "/backend/js/bootstrap/bootstrap.bundle.min.js",
    "/backend/js/icons/feather-icon/feather.min.js",
    "/backend/js/icons/feather-icon/feather-icon.js",
    "/backend/js/scrollbar/simplebar.js",
    "/backend/js/scrollbar/custom.js",
    "/backend/js/config.js",
    "/backend/js/script.js",
    "/backend/js/sidebar-menu.js",
    // sidebar-pin.js intentionally skipped — it requires a .pin-title
    // element + .fa-thumb-tack icons in the sidebar (a "pin menu items"
    // feature from the original Laravel template). Our React port has
    // neither, so the script crashes on togglePinnedName() with a null
    // dereference and provides no other functionality.
    "/backend/js/select2/select2.full.min.js",
    "/backend/js/select2/select2-custom.js",
    "/backend/js/tooltip-init.js"
  ];
  function loadNext(i){
    if(i>=sources.length) return;
    var s=document.createElement("script");
    s.src=sources[i];
    s.async=false;
    s.onload=function(){loadNext(i+1);};
    s.onerror=function(){console.error("[admin-theme] failed to load",sources[i]);loadNext(i+1);};
    document.body.appendChild(s);
  }
  loadNext(0);
})();0:{"rsc":["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/dc0049391df53b19.css","precedence":"next"}]],["$","html",null,{"lang":"en","children":[["$","head",null,{"children":[["$","meta",null,{"httpEquiv":"X-UA-Compatible","content":"IE=edge"}],["$","meta",null,{"name":"description","content":"Vishwakarma Gifts admin panel"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.googleapis.com"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.gstatic.com","crossOrigin":""}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@200;300;400;600;700;800;900&display=swap","rel":"stylesheet"}],["$","link",null,{"href":"https://fonts.googleapis.com/css?family=Roboto:300,300i,400,400i,500,500i,700,700i,900&display=swap","rel":"stylesheet"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/font-awesome.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/vendors/slick.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/vendors/slick-theme.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/vendors/scrollbar.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/vendors/select2.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/vendors/animate.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/vendors/datatables.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/vendors/owlcarousel.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/vendors/jsgrid.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/vendors/bootstrap.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/style.css"}],["$","link",null,{"id":"color","rel":"stylesheet","href":"/backend/css/color-1.css","media":"screen"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/responsive.css"}],["$","link",null,{"rel":"stylesheet","href":"/backend/css/developer.css"}]]}],["$","body",null,{"children":[["$","$L2",null,{"parallelRouterKey":"children","template":["$","$L3",null,{}],"notFound":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],[]]}],["$","$L4",null,{"src":"/backend/js/jquery.min.js","strategy":"beforeInteractive"}],["$","$L4",null,{"id":"vish-admin-theme-loader","strategy":"afterInteractive","dangerouslySetInnerHTML":{"__html":"$5"}}]]}]]}]]}],"isPartial":false,"staleTime":300,"varyParams":null,"buildId":"HRy9MF21coxJRyfnRlLRD"}
