const frame=document.querySelector('iframe');
frame.addEventListener('load',async()=>{
  const d=frame.contentDocument,w=frame.contentWindow;await d.fonts.load('46px Diary','한글');await d.fonts.ready;
  d.querySelector('#body').value='오늘은 천천히 걸었다.\n\n작고 소중한 순간을 기억하고 싶다.';d.querySelector('#body').dispatchEvent(new w.Event('input',{bubbles:true}));
  await new Promise(r=>setTimeout(r,200));
  const results=[];for(const width of [320,390,430]){frame.style.width=width+'px';await new Promise(r=>requestAnimationFrame(r));results.push(`${d.documentElement.scrollWidth<=width?'PASS':'FAIL'} ${width}px 가로 넘침 없음 (${d.documentElement.scrollWidth}px)`);}
  frame.style.width='390px';document.querySelector('#result').textContent=results.join('\n');
});
