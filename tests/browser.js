import {renderPage,drawPhoto,paginate,wrapText,PW,PH} from '../layout.js';
const results=document.querySelector('#results');const messages=[];
function check(ok,name){messages.push(`${ok?'PASS':'FAIL'} ${name}`);results.textContent=messages.join('\n');if(!ok)throw Error(name);}
try{
  const fonts=await document.fonts.load('46px Diary','한글');await document.fonts.ready;check(fonts.length>0,'한글 웹폰트 로딩');
  const image=document.createElement('canvas');image.width=1200;image.height=800;const ic=image.getContext('2d');ic.fillStyle='#73a4b4';ic.fillRect(0,0,1200,800);ic.fillStyle='#ddb47e';ic.fillRect(0,0,600,400);ic.fillStyle='#355344';ic.fillRect(600,400,600,400);
  const cropCanvas=document.createElement('canvas');cropCanvas.width=PW;cropCanvas.height=PH;const cc=cropCanvas.getContext('2d');const output=document.querySelector('#result');
  for(const zoom of [1,1.8,4])for(const [x,y] of [[.5,.5],[.25,.75],[.8,.2]]){const crop={zoom,x,y};drawPhoto(cc,image,crop);renderPage(output,{top:930,lines:['오늘도 소중한 하루.','한글 가각간 가나다라 힣'],photo:true},0,1,'2026-09-21',image,crop);const a=cc.getImageData(0,0,PW,PH).data,b=output.getContext('2d').getImageData(96,266,PW,PH).data;check(a.every((value,i)=>value===b[i]),`crop 픽셀 일치 (zoom ${zoom}, center ${x}/${y})`);}
  const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));const png=await createImageBitmap(blob);check(png.width===1080&&png.height===1920,'PNG 1080 × 1920');const decoded=document.createElement('canvas');decoded.width=1080;decoded.height=1920;decoded.getContext('2d').drawImage(png,0,0);const raw=output.getContext('2d').getImageData(0,0,1080,1920).data,copy=decoded.getContext('2d').getImageData(0,0,1080,1920).data;check(raw.every((v,i)=>v===copy[i]),'미리보기와 PNG 디코딩 픽셀 완전 일치');png.close();
  const text='오늘은 한글 줄바꿈을 확인하는 날입니다. 가족과 함께 걸었고, 조용한 오후를 보냈습니다.\n\n'.repeat(50);const ctx=output.getContext('2d');ctx.font='46px Diary';const lines=wrapText(text,s=>ctx.measureText(s).width);const pages=paginate(lines,true);check(pages.length>2,'긴 한글 자동 페이지 분할');check(pages.flatMap(p=>p.lines).join('')===text.replaceAll('\n',''),'페이지 분할 후 글자 누락 없음');check(lines.every(s=>ctx.measureText(s).width<=PW),'모든 줄이 본문 영역 안에 배치');check(pages.slice(1).every(p=>!p.photo&&p.top===300),'2페이지부터 사진 생략');
  results.textContent+='\n완료';
}catch(error){results.textContent+='\nERROR '+error.message;}
