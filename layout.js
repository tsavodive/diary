export const W=1080,H=1920,M=96,PW=888,PH=600,FONT=46,LEADING=76,DATE_FONT=54,MEMO_FONT=32;
export const PHOTO_FORMATS={classic:{width:PW,height:600,bodyTop:930},square:{width:PW,height:888,bodyTop:1218},full:{width:PW,height:1480,bodyTop:1810}};
export function photoLayout(format='classic'){return PHOTO_FORMATS[format]||PHOTO_FORMATS.classic;}
export const EMOJI_STACK='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
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
export function wrapTextLayout(text,measure,width=PW){
  const result=[];
  for(const paragraph of text.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n')){
    const wrapped=wrapText(paragraph,measure,width);
    wrapped.forEach((line,index)=>result.push({text:line,justify:index<wrapped.length-1}));
  }
  return result;
}
export function paginate(lines,photo,format='classic'){const pages=[];let offset=0;do{const first=pages.length===0&&photo;const top=first?photoLayout(format).bodyTop:300;const capacity=Math.max(0,Math.floor((1780-top)/LEADING)+1);pages.push({top,lines:lines.slice(offset,offset+capacity),photo:first});offset+=capacity;if(first&&capacity===0&&offset<lines.length)continue;}while(offset<lines.length);return pages;}
export function cropRect(image,crop,w=PW,h=PH){const scale=Math.max(w/image.width,h/image.height)*crop.zoom;const sw=w/scale,sh=h/scale;return {sx:Math.max(0,Math.min(image.width-sw,crop.x*image.width-sw/2)),sy:Math.max(0,Math.min(image.height-sh,crop.y*image.height-sh/2)),sw,sh};}
export function clampCrop(image,crop,w=PW,h=PH){const r=cropRect(image,crop,w,h);crop.x=(r.sx+r.sw/2)/image.width;crop.y=(r.sy+r.sh/2)/image.height;return crop;}
export function drawPhoto(ctx,image,crop,x=0,y=0,w=PW,h=PH){const r=cropRect(image,crop,w,h);ctx.drawImage(image,r.sx,r.sy,r.sw,r.sh,x,y,w,h);}
const splitText=text=>graphemes?Array.from(graphemes.segment(text),s=>s.segment):Array.from(text);
export function measureStyled(ctx,text,scaleX=1,letterSpacing=0){const chars=splitText(text);if(!chars.length)return 0;return (chars.reduce((sum,char)=>sum+ctx.measureText(char).width,0)+letterSpacing*(chars.length-1))*scaleX;}
export function dateMemoLayout(dateWidth,memoWidth,width=PW,gap=38){return {wrap:memoWidth>width-dateWidth-gap,memoWidth:Math.min(memoWidth,width)};}
function drawStyled(ctx,text,x,y,{scaleX=1,letterSpacing=0,align='left',extraSpacing=0}={}){const chars=splitText(text);const width=measureStyled(ctx,text,scaleX,letterSpacing+extraSpacing);let start=x;if(align==='right')start-=width;else if(align==='center')start-=width/2;ctx.save();ctx.translate(start,y);ctx.scale(scaleX,1);let cursor=0;for(const char of chars){ctx.fillText(char,cursor,0);cursor+=ctx.measureText(char).width+letterSpacing+extraSpacing;}ctx.restore();return width;}
function fitText(ctx,text,maxWidth,style){if(measureStyled(ctx,text,style.scaleX,style.letterSpacing)<=maxWidth)return text;const chars=splitText(text);while(chars.length&&measureStyled(ctx,chars.join('')+'…',style.scaleX,style.letterSpacing)>maxWidth)chars.pop();return chars.join('')+'…';}
function drawJustified(ctx,text,x,y,width,style){const chars=splitText(text);if(chars.length<2){drawStyled(ctx,text,x,y,style);return;}const natural=measureStyled(ctx,text,style.scaleX,style.letterSpacing);const visualGap=(width-natural)/(chars.length-1);if(visualGap<0||visualGap>16){drawStyled(ctx,text,x,y,style);return;}drawStyled(ctx,text,x,y,{...style,extraSpacing:visualGap/style.scaleX});}
export function renderPage(canvas,page,index,total,date,image,crop,options={}){canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');const memo=options.memo?.trim()||'';const align=options.align||'left';const bodyFont=options.bodyFont||'Diary';const scaleX=options.scaleX||1;const bodySpacing=options.letterSpacing||0;const condensed=options.condensed||false;ctx.fillStyle=options.paperColor||'#fffefb';ctx.fillRect(0,0,W,H);
  const dateStyle={scaleX,letterSpacing:condensed?-DATE_FONT*.03:0};ctx.fillStyle='#354b41';ctx.font=`700 ${DATE_FONT}px ${bodyFont},${EMOJI_STACK}`;const dateWidth=drawStyled(ctx,dateLabel(date),M,166,dateStyle);
  let memoWrapped=false;
  if(memo){const memoStyle={scaleX,letterSpacing:condensed?-MEMO_FONT*.03:0};ctx.fillStyle='#8b9585';ctx.font=`${MEMO_FONT}px ${bodyFont},${EMOJI_STACK}`;const memoWidth=measureStyled(ctx,memo,memoStyle.scaleX,memoStyle.letterSpacing);memoWrapped=dateMemoLayout(dateWidth,memoWidth).wrap;const available=memoWrapped?PW:PW-dateWidth-38;drawStyled(ctx,fitText(ctx,memo,available,memoStyle),W-M,memoWrapped?211:166,{...memoStyle,align:'right'});}
  const dividerY=memoWrapped?242:216;ctx.strokeStyle='#cbd4ca';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(M,dividerY);ctx.lineTo(W-M,dividerY);ctx.stroke();
  if(page.photo&&image){const frame=photoLayout(options.photoFormat);drawPhoto(ctx,image,crop,M,266,frame.width,frame.height);}
  ctx.strokeStyle='#dfe4dc';ctx.lineWidth=1.5;for(let y=page.top+15;y<=1800;y+=LEADING){ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(W-M,y);ctx.stroke();}
  const bodyStyle={scaleX,letterSpacing:bodySpacing};ctx.font=`${FONT}px ${bodyFont},${EMOJI_STACK}`;ctx.fillStyle='#34423a';page.lines.forEach((entry,i)=>{const line=typeof entry==='string'?entry:entry.text;const y=page.top+i*LEADING;if(align==='right')drawStyled(ctx,line,W-M,y,{...bodyStyle,align:'right'});else if(align==='justify'&&entry.justify&&line.trim())drawJustified(ctx,line,M,y,PW,bodyStyle);else drawStyled(ctx,line,M,y,bodyStyle);});
  ctx.font='26px Diary';ctx.textAlign='center';ctx.fillStyle='#869180';ctx.fillText(`${index+1} / ${total}`,W/2,1860);ctx.textAlign='left';return canvas;
}
