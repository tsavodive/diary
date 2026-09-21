import {PW,PH,FONT,localToday,wrapText,paginate,cropRect,clampCrop,drawPhoto,renderPage} from './layout.js';
const $=id=>document.getElementById(id);
const date=$('date'),body=$('body'),preview=$('preview'),cropCanvas=$('crop');
date.value=localToday();
let image=null,crop={zoom:1,x:.5,y:.5},pages=[],current=0,ready=false,busy=false,version=0,uploadVersion=0,urls=[],timer;
const measureCanvas=document.createElement('canvas'),measure=measureCanvas.getContext('2d');
function status(message){$('status').textContent=message;}
function revokeDownloads(){urls.forEach(URL.revokeObjectURL);urls=[];$('downloadLinks').replaceChildren();$('downloads').hidden=true;}
function update(){
  version++;revokeDownloads();$('count').textContent=`${Array.from(body.value).length.toLocaleString('ko-KR')}자`;
  if(!ready)return;
  if(!date.validity.valid||!date.value){$('save').disabled=true;status('날짜를 선택해주세요.');return;}
  measure.font=`${FONT}px Diary`;pages=paginate(wrapText(body.value,t=>measure.measureText(t).width),!!image);
  current=Math.min(current,pages.length-1);showPage();$('save').disabled=busy;
  status(pages.length>1?`총 ${pages.length}장의 일기로 나누었어요.`:'');
}
function showPage(){if(!pages.length)return;renderPage(preview,pages[current],current,pages.length,date.value,image,crop);$('pageCount').textContent=`${current+1} / ${pages.length}`;$('prev').disabled=current===0;$('next').disabled=current===pages.length-1;}
function paintCrop(){if(!image)return;clampCrop(image,crop);const c=cropCanvas.getContext('2d');c.clearRect(0,0,PW,PH);drawPhoto(c,image,crop);$('zoom').value=crop.zoom;$('zoomValue').textContent=`${Math.round(crop.zoom*100)}%`;}
function changedCrop(){paintCrop();clearTimeout(timer);timer=setTimeout(update,70);}
function setZoom(value,anchor={x:PW/2,y:PH/2}){if(!image)return;const old=cropRect(image,crop);const sx=old.sx+anchor.x/PW*old.sw,sy=old.sy+anchor.y/PH*old.sh;crop.zoom=Math.max(1,Math.min(4,value));const next=cropRect(image,crop);crop.x=(sx+(0.5-anchor.x/PW)*next.sw)/image.width;crop.y=(sy+(0.5-anchor.y/PH)*next.sh)/image.height;changedCrop();}
function resetCrop(){crop={zoom:1,x:.5,y:.5};changedCrop();}
async function decodePhoto(file){
  // Modern browsers apply EXIF once at decode time; never rotate a decoded image again.
  if(window.createImageBitmap){try{return await createImageBitmap(file,{imageOrientation:'from-image'});}catch{}}
  const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();return img;}finally{URL.revokeObjectURL(url);}
}
$('photo').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;const token=++uploadVersion;
  if(file.size>40*1024*1024){status('40MB 이하의 사진을 골라주세요.');event.target.value='';return;}
  status('사진을 준비하고 있어요…');busy=true;$('save').disabled=true;
  try{const decoded=await decodePhoto(file);if(token!==uploadVersion){decoded.close?.();return;}
    // Bound retained image memory for large phone photos. Original file is unchanged.
    const ratio=Math.min(1,4096/Math.max(decoded.width,decoded.height));const normalized=document.createElement('canvas');normalized.width=Math.round(decoded.width*ratio);normalized.height=Math.round(decoded.height*ratio);normalized.getContext('2d').drawImage(decoded,0,0,normalized.width,normalized.height);decoded.close?.();image=normalized;
    $('cropPanel').hidden=false;$('remove').hidden=false;$('uploadLabel').querySelector('strong').textContent='다른 사진으로 바꾸기';$('uploadLabel').querySelector('span:last-child').textContent='사진을 다시 선택할 수 있어요';resetCrop();
  }catch{if(token===uploadVersion)status('이 사진을 열 수 없어요. JPG, PNG 또는 WebP 사진으로 다시 선택해주세요.');}
  finally{if(token===uploadVersion){busy=false;$('save').disabled=!ready;event.target.value='';if(image)update();}}
});
$('remove').onclick=()=>{uploadVersion++;busy=false;image=null;$('cropPanel').hidden=true;$('remove').hidden=true;$('uploadLabel').querySelector('strong').textContent='오늘의 사진을 골라주세요';$('uploadLabel').querySelector('span:last-child').textContent='사진 없이 글만 남겨도 좋아요';update();};
$('reset').onclick=resetCrop;$('zoom').oninput=e=>setZoom(Number(e.target.value));
const pointers=new Map();let gesture=null;
function point(e){const r=cropCanvas.getBoundingClientRect();return {x:(e.clientX-r.left)*PW/r.width,y:(e.clientY-r.top)*PH/r.height};}
function snapshot(){const p=[...pointers.values()];if(!p.length)return null;return {mid:p.length>1?{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2}:p[0],distance:p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0};}
cropCanvas.onpointerdown=e=>{if(!image)return;cropCanvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,point(e));gesture=snapshot();};
cropCanvas.onpointermove=e=>{if(!pointers.has(e.pointerId)||!image)return;pointers.set(e.pointerId,point(e));const next=snapshot();if(gesture){if(next.distance&&gesture.distance)setZoom(crop.zoom*next.distance/gesture.distance,gesture.mid);const scale=Math.max(PW/image.width,PH/image.height)*crop.zoom;crop.x-=(next.mid.x-gesture.mid.x)/scale/image.width;crop.y-=(next.mid.y-gesture.mid.y)/scale/image.height;changedCrop();}gesture=next;};
function endPointer(e){pointers.delete(e.pointerId);gesture=snapshot();clearTimeout(timer);update();}
cropCanvas.onpointerup=endPointer;cropCanvas.onpointercancel=endPointer;cropCanvas.onlostpointercapture=endPointer;
cropCanvas.addEventListener('wheel',e=>{if(!image)return;e.preventDefault();setZoom(crop.zoom*Math.exp(-e.deltaY*.001),point(e));},{passive:false});
cropCanvas.onkeydown=e=>{const directions={ArrowLeft:[1,0],ArrowRight:[-1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};if(!image||!directions[e.key])return;e.preventDefault();const [x,y]=directions[e.key];crop.x+=x*.015/crop.zoom;crop.y+=y*.015/crop.zoom;changedCrop();};
date.oninput=update;body.oninput=()=>{clearTimeout(timer);timer=setTimeout(update,100);};
$('prev').onclick=()=>{current--;showPage();};$('next').onclick=()=>{current++;showPage();};
const toBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG 생성 실패')),'image/png'));
$('save').onclick=async()=>{
  clearTimeout(timer);update();if(!ready||!date.validity.valid||busy)return;busy=true;$('save').disabled=true;const generation=version;const source={pages:pages.map(p=>({...p,lines:[...p.lines]})),date:date.value,image,crop:{...crop}};
  try{await document.fonts.ready;const canvas=document.createElement('canvas');
    for(let i=0;i<source.pages.length;i++){
      status(`PNG를 만들고 있어요… ${i+1} / ${source.pages.length}`);
      renderPage(canvas,source.pages[i],i,source.pages.length,source.date,source.image,source.crop);const blob=await toBlob(canvas);
      if(version!==generation){status('내용이 바뀌었어요. PNG 저장을 다시 눌러주세요.');revokeDownloads();return;}
      const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=`diary_${source.date.replaceAll('-','')}_${i+1}.png`;a.textContent=`${i+1}장 PNG 저장`;a.target='_blank';a.rel='noopener';$('downloadLinks').append(a);
    }
    canvas.width=1;canvas.height=1;$('downloads').hidden=false;
    if(source.pages.length===1)$('downloadLinks').firstElementChild.click();
    status(source.pages.length===1?'PNG를 준비했어요. 아래 링크에서 다시 저장할 수 있어요.':`${source.pages.length}장의 PNG를 준비했어요. 미리보기 아래에서 한 장씩 저장해주세요.`);
    if(source.pages.length>1)$('downloads').scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(error){revokeDownloads();status('이미지를 만들지 못했어요. 열린 탭을 정리한 뒤 다시 시도해주세요.');console.error(error);}
  finally{busy=false;$('save').disabled=!ready||!date.validity.valid;}
};
async function init(){try{const loaded=await document.fonts.load(`${FONT}px Diary`,'오늘의 일기 한글');await document.fonts.ready;if(!loaded.length)throw new Error('font missing');ready=true;update();}catch{status('한글 폰트를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해주세요.');}}
init();
window.addEventListener('beforeunload',e=>{if(body.value||image){e.preventDefault();e.returnValue='';}});
