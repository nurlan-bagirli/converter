(() => {
const el=id=>document.getElementById(id);
const state={mode:"image",files:[]};
const input=el("files"),drop=el("drop"),convert=el("convert");
const modes={
image:{title:"Image converter",desc:"Convert images to PNG, JPG or WEBP.",accept:"image/*",multiple:true,formats:[["image/png","PNG"],["image/jpeg","JPG"],["image/webp","WEBP"]]},
compress:{title:"Image compressor",desc:"Reduce image file size with quality control.",accept:"image/*",multiple:true,formats:[["image/webp","WEBP"],["image/jpeg","JPG"]]},
resize:{title:"Image resizer",desc:"Resize images while preserving proportions.",accept:"image/*",multiple:true,formats:[["image/png","PNG"],["image/jpeg","JPG"],["image/webp","WEBP"]]},
pdf:{title:"PDF to image",desc:"Export PDF pages as PNG or JPG files.",accept:".pdf,application/pdf",multiple:false,formats:[["image/png","PNG"],["image/jpeg","JPG"]]},
imagepdf:{title:"Image to PDF",desc:"Combine selected images into one PDF file.",accept:"image/*",multiple:true,formats:[["application/pdf","PDF"]]}
};
function message(text,error=false){el("status").textContent=text;el("status").style.color=error?"#c44":"#278b69";}
function mode(name){state.mode=name;state.files=[];const m=modes[name];el("tool-title").textContent=m.title;el("tool-desc").textContent=m.desc;input.accept=m.accept;input.multiple=m.multiple;el("format").innerHTML=m.formats.map(f=>'<option value="'+f[0]+'">'+f[1]+'</option>').join("");el("quality-label").hidden=!["image","compress"].includes(name);el("resize-label").hidden=name!=="resize";el("pdf-format-label").hidden=name!=="pdf";el("file-hint").textContent=name==="pdf"?"PDF documents · Pages exported individually":"Images · JPG, PNG, WEBP and other browser-supported formats";render();message("");el("workspace").scrollIntoView({behavior:"smooth",block:"center"});}
function render(){el("file-list").innerHTML="";state.files.forEach((f,i)=>{const row=document.createElement("div");row.className="file-item";const n=document.createElement("span");n.textContent=f.name;const s=document.createElement("span");s.textContent=(f.size/1024/1024).toFixed(2)+" MB";const b=document.createElement("button");b.textContent="Remove";b.onclick=()=>{state.files.splice(i,1);render()};row.append(n,s,b);el("file-list").append(row)});convert.disabled=!state.files.length;}
function add(files){const good=Array.from(files).filter(f=>state.mode==="pdf"?f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf"):f.type.startsWith("image/"));if(!good.length){message("Please choose a supported file.",true);return;}state.files=state.mode==="pdf"?good.slice(0,1):state.files.concat(good).slice(0,20);render();message("");}
function loadImage(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>reject(new Error("Could not read image."));img.src=url;});}
function blob(canvas,type,q){return new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error("Could not create output.")),type,q));}
function save(data,name){const url=URL.createObjectURL(data),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);}
function stem(name){return name.replace(/\.[^.]+$/,"");}
async function imageWork(){for(const file of state.files){const img=await loadImage(file),canvas=document.createElement("canvas");let w=img.naturalWidth,h=img.naturalHeight;if(state.mode==="resize"){const nw=Number(el("width").value),nh=Number(el("height").value);if(!nw&&!nh)throw Error("Enter a width or height.");if(nw&&nh){w=nw;h=nh}else if(nw){w=nw;h=Math.round(img.naturalHeight*nw/img.naturalWidth)}else{h=nh;w=Math.round(img.naturalWidth*nh/img.naturalHeight)}}canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d"),type=el("format").value;if(type==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h)}ctx.drawImage(img,0,0,w,h);const q=Number(el("quality").value)/100,out=await blob(canvas,type,q),ext=type==="image/jpeg"?"jpg":type.split("/")[1];save(out,stem(file.name)+(state.mode==="compress"?"-compressed":state.mode==="resize"?"-resized":"")+"."+ext);}}
async function pdfWork(){if(!window.pdfjsLib)throw Error("PDF reader is loading. Try again shortly.");pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";const pdf=await pdfjsLib.getDocument({data:await state.files[0].arrayBuffer()}).promise;if(pdf.numPages>100)throw Error("This first version supports up to 100 pages per PDF.");const type=el("pdf-format").value;for(let p=1;p<=pdf.numPages;p++){message("Rendering page "+p+" of "+pdf.numPages+"…");const page=await pdf.getPage(p),view=page.getViewport({scale:1.5}),canvas=document.createElement("canvas");canvas.width=view.width;canvas.height=view.height;await page.render({canvasContext:canvas.getContext("2d"),viewport:view}).promise;save(await blob(canvas,type,.92),stem(state.files[0].name)+"-page-"+p+"."+(type==="image/jpeg"?"jpg":"png"));}}
async function imagesPdf(){
  const JsPDF=window.jspdf?.jsPDF||window.jsPDF;
  if(!JsPDF)throw Error("PDF creator is not available. Refresh the page and try again.");
  if(!state.files.length)throw Error("Choose at least one image.");
  const pageW=595.28,pageH=841.89,margin=28;
  let doc=null;
  for(let i=0;i<state.files.length;i++){
    const file=state.files[i];
    message("Adding image "+(i+1)+" of "+state.files.length+" to PDF…");
    const img=await loadImage(file);
    const naturalW=img.naturalWidth||img.width,naturalH=img.naturalHeight||img.height;
    if(!naturalW||!naturalH)throw Error("Image has invalid dimensions: "+file.name);
    const orientation=naturalW>naturalH?"landscape":"portrait";
    if(!doc)doc=new JsPDF({orientation,unit:"pt",format:"a4",compress:true});
    else doc.addPage("a4",orientation);
    const currentW=orientation==="landscape"?pageH:pageW;
    const currentH=orientation==="landscape"?pageW:pageH;
    const maxW=currentW-margin*2,maxH=currentH-margin*2;
    const scale=Math.min(maxW/naturalW,maxH/naturalH,1);
    const outW=Math.max(1,Math.round(naturalW*scale));
    const outH=Math.max(1,Math.round(naturalH*scale));
    const canvas=document.createElement("canvas");
    canvas.width=outW;canvas.height=outH;
    const ctx=canvas.getContext("2d");
    if(!ctx)throw Error("Could not prepare image: "+file.name);
    ctx.fillStyle="#fff";ctx.fillRect(0,0,outW,outH);
    ctx.drawImage(img,0,0,outW,outH);
    const dataUrl=canvas.toDataURL("image/jpeg",0.94);
    const x=(currentW-outW)/2,y=(currentH-outH)/2;
    doc.addImage(dataUrl,"JPEG",x,y,outW,outH,undefined,"FAST");
  }
  if(!doc)throw Error("No valid images were selected.");
  doc.save("converted-images.pdf");
}
convert.addEventListener("click",async()=>{convert.disabled=true;convert.textContent="Working…";try{if(state.mode==="pdf")await pdfWork();else if(state.mode==="imagepdf")await imagesPdf();else await imageWork();message("Done! Your download is ready.");}catch(e){message(e.message||"Conversion failed.",true);}finally{convert.textContent="Convert now →";convert.disabled=!state.files.length;}});
el("browse").onclick=e=>{e.stopPropagation();input.click()};drop.onclick=()=>input.click();drop.onkeydown=e=>{if(e.key==="Enter")input.click()};input.onchange=()=>{add(input.files);input.value=""};
["dragenter","dragover"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.add("drag")}));["dragleave","drop"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.remove("drag")}));drop.addEventListener("drop",e=>add(e.dataTransfer.files));
el("quality").oninput=()=>el("quality-value").textContent=el("quality").value+"%";
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>mode(b.dataset.mode)));
el("year").textContent=new Date().getFullYear();mode("image");
})();