export const W=1080,H=1920,M=96,PW=888,PH=600,FONT=46,LEADING=76;
export function localToday(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function dateLabel(value){const [y,m,d]=value.split('-').map(Number);const date=new Date(0);date.setFullYear(y,m-1,d);date.setHours(12,0,0,0);return `${y}년 ${m}월 ${d}일 ${'일월화수목금토'[date.getDay()]}요일`;}
const graphemes=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ko',{granularity:'grapheme'}):null;
export function wrapText(text,measure,width=PW){
  const result=[];
  for(const paragraph of text.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n')){
    const chars=graphemes?Array.from(graphemes.segment(paragraph),s=>s.segment):Array.from(paragraph);
    if(!chars.length){result.push('');continue;}
    let start=0;
    while(start<chars.length){let end=start,lastSpace=-1;
      while(end<chars.length&&measure(chars.slice(start,end+1).join(''))<=width){if(/\s/.test(chars[end]))lastSpace=end;end++;}
      if(end===start)end++;
      // Prefer word boundaries unless a Korean word is longer than a full line.
      if(end<chars.length&&lastSpace>start)end=lastSpace+1;
      // Keep closing punctuation with the preceding syllable without overflowing.
      if(end<chars.length&&/^[、。，．！？!?…:;%)\]】」』”’]/u.test(chars[end])&&end-start>1)end--;
      result.push(chars.slice(start,end).join(''));start=end;
    }
  }return result;
}
export function paginate(lines,photo){const pages=[];let offset=0;do{const top=pages.length===0&&photo?930:300;const capacity=Math.floor((1780-top)/LEADING)+1;pages.push({top,lines:lines.slice(offset,offset+capacity),photo:pages.length===0&&photo});offset+=capacity;}while(offset<lines.length);return pages;}
export function cropRect(image,crop){const scale=Math.max(PW/image.width,PH/image.height)*crop.zoom;const sw=PW/scale,sh=PH/scale;return {sx:Math.max(0,Math.min(image.width-sw,crop.x*image.width-sw/2)),sy:Math.max(0,Math.min(image.height-sh,crop.y*image.height-sh/2)),sw,sh};}
export function clampCrop(image,crop){const r=cropRect(image,crop);crop.x=(r.sx+r.sw/2)/image.width;crop.y=(r.sy+r.sh/2)/image.height;return crop;}
export function drawPhoto(ctx,image,crop,x=0,y=0,w=PW,h=PH){const r=cropRect(image,crop);ctx.drawImage(image,r.sx,r.sy,r.sw,r.sh,x,y,w,h);}
export function renderPage(canvas,page,index,total,date,image,crop){canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');ctx.fillStyle='#fffdf4';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#d9dfd4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,216);ctx.lineTo(W-M,216);ctx.stroke();
  ctx.fillStyle='#354b41';ctx.font='46px Diary';ctx.fillText(dateLabel(date),M,166);
  ctx.fillStyle='#8b9585';ctx.font='26px Diary';ctx.textAlign='right';ctx.fillText('나의 하루',W-M,166);ctx.textAlign='left';
  if(page.photo&&image)drawPhoto(ctx,image,crop,M,266);
  ctx.strokeStyle='#dfe4dc';ctx.lineWidth=1.5;for(let y=page.top+15;y<=1800;y+=LEADING){ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(W-M,y);ctx.stroke();}
  ctx.font=`${FONT}px Diary`;ctx.fillStyle='#34423a';page.lines.forEach((line,i)=>ctx.fillText(line,M,page.top+i*LEADING));
  ctx.font='26px Diary';ctx.textAlign='center';ctx.fillStyle='#869180';ctx.fillText(`${index+1} / ${total}`,W/2,1860);ctx.textAlign='left';return canvas;
}
