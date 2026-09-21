const frame=document.querySelector('iframe');
frame.addEventListener('load',async()=>{
  const d=frame.contentDocument,w=frame.contentWindow;await d.fonts.load('46px Diary','한글');await d.fonts.ready;
  d.querySelector('#body').value='오늘은 천천히 걸었다.\n\n작고 소중한 순간을 기억하고 싶다.';d.querySelector('#body').dispatchEvent(new w.Event('input',{bubbles:true}));
  await new Promise(r=>setTimeout(r,200));
  const results=[];for(const width of [320,390,430]){frame.style.width=width+'px';await new Promise(r=>requestAnimationFrame(r));const controls=[...d.querySelectorAll('input,select,button,textarea,canvas,.paper')];const inside=controls.every(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=width+1;});const stacked=width>430||d.querySelector('.writing-settings').getBoundingClientRect().height>90;results.push(`${d.documentElement.scrollWidth<=width?'PASS':'FAIL'} ${width}px 페이지 가로 넘침 없음 (${d.documentElement.scrollWidth}px)`);results.push(`${inside?'PASS':'FAIL'} ${width}px 입력·사진·미리보기 잘림 없음`);results.push(`${stacked?'PASS':'FAIL'} ${width}px 설정 UI 세로 배치`);}
  frame.style.width='390px';document.querySelector('#result').textContent=results.join('\n');
});
