// Loaded first. Makes every game smoother and sharper without touching each game.
(()=>{
  const live=new Map(),si=window.setInterval,ci=window.clearInterval;let n=1e6;
  // Short timers (game loops) run on requestAnimationFrame with a fixed step, so they sync to the screen and keep the same speed on 60/120/144 Hz.
  window.setInterval=(f,d=0,...a)=>{
    if(d>20)return si(f,d,...a);
    const h=n++;let last=performance.now(),acc=0;
    const s=t=>{
      acc=Math.min(acc+t-last,100);last=t;
      while(acc>=d&&live.has(h)){acc-=d;try{f(...a)}catch(e){console.error(e)}}
      if(live.has(h))live.set(h,requestAnimationFrame(s));
    };
    live.set(h,requestAnimationFrame(s));return h;
  };
  window.clearInterval=h=>{if(live.has(h)){cancelAnimationFrame(live.get(h));live.delete(h)}else ci(h)};
  // Canvases render at the screen's real pixel density, so nothing looks blurry on phones or laptops.
  const gc=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(t,...a){
    const x=gc.call(this,t,...a);
    if(t=='2d'&&!this._d){
      this._d=1;const r=Math.min(3,Math.max(1,devicePixelRatio||1)),w=this.width,h=this.height;
      if(r>1){this.style.width=w+'px';this.width=w*r;this.height=h*r;x.scale(r,r)}
      x.imageSmoothingQuality='high';
    }
    return x;
  };
})();
