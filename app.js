(() => {
const el=id=>document.getElementById(id);
const state={mode:"image",files:[]};
const input=el("files"),drop=el("drop"),convert=el("convert");
const modes={
image:{title:"Image converter",desc:"Convert images to PNG, JPG or WEBP.",accept:"image/*,.heic,.heif",multiple:true,formats:[["image/png","PNG"],["image/jpeg","JPG"],["image/webp","WEBP"]]},
compress:{title:"Image compressor",desc:"Reduce image file size with quality control.",accept:"image/*,.heic,.heif",multiple:true,formats:[["image/webp","WEBP"],["image/jpeg","JPG"]]},
resize:{title:"Image resizer",desc:"Resize images while preserving proportions.",accept:"image/*,.heic,.heif",multiple:true,formats:[["image/png","PNG"],["image/jpeg","JPG"],["image/webp","WEBP"]]},
pdf:{title:"PDF to image",desc:"Export PDF pages as PNG or JPG files.",accept:".pdf,application/pdf",multiple:false,formats:[["image/png","PNG"],["image/jpeg","JPG"]]},
imagepdf:{title:"Image to PDF",desc:"Combine JPG, PNG, WEBP and HEIC images into one compressed PDF.",accept:"image/*,.heic,.heif",multiple:true,formats:[["application/pdf","PDF"]]},
pdfpdf:{title:"PDF to PDF optimizer",desc:"Rebuild a PDF as a compressed, image-based PDF. Text will not remain selectable.",accept:".pdf,application/pdf",multiple:false,formats:[["application/pdf","PDF"]]},
pdfmerge:{title:"Merge PDFs",desc:"Combine multiple PDF files in the selected order.",accept:".pdf,application/pdf",multiple:true,formats:[["application/pdf","PDF"]]},
pdfsplit:{title:"Split PDF",desc:"Extract selected pages into a separate PDF.",accept:".pdf,application/pdf",multiple:false,formats:[["application/pdf","PDF"]]},
pdforganize:{title:"Organize PDF",desc:"Reorder, rotate or remove PDF pages.",accept:".pdf,application/pdf",multiple:false,formats:[["application/pdf","PDF"]]},
pdfcompress:{title:"Compress PDF",desc:"Reduce file size by converting pages to optimized images. Selectable text will be lost.",accept:".pdf,application/pdf",multiple:false,formats:[["application/pdf","PDF"]]},
pdfextract:{title:"PDF pages to images",desc:"Export each PDF page as a JPG or PNG image.",accept:".pdf,application/pdf",multiple:false,formats:[["image/jpeg","JPG"],["image/png","PNG"]]},
crop:{title:"Crop image",desc:"Crop an image using pixel coordinates.",accept:"image/*,.heic,.heif",multiple:false,formats:[["image/webp","WEBP"],["image/jpeg","JPG"],["image/png","PNG"]]},
rotate:{title:"Rotate image",desc:"Rotate an image by 90, 180 or 270 degrees.",accept:"image/*,.heic,.heif",multiple:true,formats:[["image/webp","WEBP"],["image/jpeg","JPG"],["image/png","PNG"]]}
};
function message(text,error=false){el("status").textContent=text;el("status").style.color=error?"#c44":"#278b69";}
function mode(name){state.mode=name;state.files=[];const m=modes[name];el("tool-title").textContent=m.title;el("tool-desc").textContent=m.desc;input.accept=m.accept;input.multiple=m.multiple;el("format").innerHTML=m.formats.map(f=>'<option value="'+f[0]+'">'+f[1]+'</option>').join("");if(name==="image"||name==="compress"||name==="resize")el("format").value="image/webp";el("quality-label").hidden=!["image","compress"].includes(name);el("resize-label").hidden=name!=="resize";el("pages-label").hidden=!["pdfsplit","pdforganize"].includes(name);el("rotation-label").hidden=!["pdforganize","rotate"].includes(name);el("crop-label").hidden=name!=="crop";el("image-format-note").hidden=!(["image","compress","resize","crop","rotate"].includes(name));el("pdf-format-label").hidden=!(name==="pdf"||name==="pdfextract");el("pdf-quality-label").hidden=!(name==="imagepdf"||name==="pdfpdf"||name==="pdfcompress");el("pdf-size-label").hidden=!(name==="imagepdf"||name==="pdfpdf"||name==="pdfcompress");el("pdf-raster-note").hidden=!(["pdfpdf","pdfcompress"].includes(name));el("format-label").hidden=name.startsWith("pdf");el("file-hint").textContent=name==="pdfmerge"?"PDF documents · Select multiple files":name.startsWith("pdf")?"PDF documents · Choose one PDF file":"Images · JPG, PNG, WEBP, HEIC and HEIF";render();message("");el("workspace").scrollIntoView({behavior:"smooth",block:"center"});}
function render(){el("file-list").innerHTML="";state.files.forEach((f,i)=>{const row=document.createElement("div");row.className="file-item";const n=document.createElement("span");n.textContent=f.name;const s=document.createElement("span");s.textContent=(f.size/1024/1024).toFixed(2)+" MB";const b=document.createElement("button");b.textContent="Remove";b.onclick=()=>{state.files.splice(i,1);render()};row.append(n,s,b);el("file-list").append(row)});convert.disabled=!state.files.length;}
function isPdf(f){return f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf");}
function isImage(f){const name=(f.name||"").toLowerCase();const type=(f.type||"").toLowerCase();return type.startsWith("image/")||/\.(heic|heif|jpg|jpeg|png|webp|gif|bmp|tif|tiff|avif)$/i.test(name)||type.includes("heic")||type.includes("heif");}
function add(files){const pdfMode=state.mode.startsWith("pdf");const good=Array.from(files).filter(f=>pdfMode?isPdf(f):isImage(f));if(!good.length){message(pdfMode?"Please choose a PDF file.":"Choose an image, including HEIC or HEIF.",true);return;}state.files=pdfMode&&!["pdfmerge"].includes(state.mode)?good.slice(0,1):state.files.concat(good).slice(0,20);render();message("");}
async function normalizeImage(file){
  const name=(file.name||"image").toLowerCase();
  const type=(file.type||"").toLowerCase();
  const isHeic=/\.(heic|heif)$/i.test(name)||type.includes("heic")||type.includes("heif");
  if(isHeic){
    const decoder=window.HeicTo;
    if(typeof decoder!=="function")throw Error("HEIC_ENGINE_NOT_LOADED: HeicTo global is missing. Check CDN/network and reload.");
    try{
      if(typeof decoder.isHeic==="function" && !(await decoder.isHeic(file)))throw Error("The file extension is HEIC, but its internal signature is not recognized as HEIC/HEIF.");
      const result=await decoder({blob:file,type:"image/jpeg",quality:0.92});
      if(!(result instanceof Blob))throw Error("Decoder returned "+Object.prototype.toString.call(result)+" instead of a Blob.");
      return {blob:result,name:(file.name||"image").replace(/\.(heic|heif)$/i,"")+".jpg"};
    }catch(err){
      console.error("Convertly HEIC diagnostic:",err);
      const detail=err&&err.message?err.message:String(err);
      throw Error("HEIC conversion failed: "+detail);
    }
  }
  return {blob:file,name:file.name||"image"};
}
function loadImage(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Could not read image. HEIC/HEIF files need a supported browser and HEIC decoder."))};img.src=url;});}
function blob(canvas,type,q){return new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error("Could not create output.")),type,q));}
function save(data,name){const url=URL.createObjectURL(data),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);}
function stem(name){return name.replace(/\.[^.]+$/,"");}
async function imageWork(){let inputBytes=0,outputBytes=0;for(const file of state.files){inputBytes+=file.size;const normalized=await normalizeImage(file),img=await loadImage(normalized.blob),canvas=document.createElement("canvas");let w=img.naturalWidth,h=img.naturalHeight;if(state.mode==="resize"){const nw=Number(el("width").value),nh=Number(el("height").value);if(!nw&&!nh)throw Error("Enter a width or height.");if(nw&&nh){w=nw;h=nh}else if(nw){w=nw;h=Math.round(img.naturalHeight*nw/img.naturalWidth)}else{h=nh;w=Math.round(img.naturalWidth*nh/img.naturalHeight)}}canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d"),type=el("format").value;if(type==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h)}if(state.mode==="crop"){const x=Number(el("crop-x").value),y=Number(el("crop-y").value),cw=Number(el("crop-w").value),ch=Number(el("crop-h").value);if(!cw||!ch||x+cw>img.naturalWidth||y+ch>img.naturalHeight)throw Error("Crop coordinates exceed image dimensions.");canvas.width=cw;canvas.height=ch;ctx.drawImage(img,x,y,cw,ch,0,0,cw,ch);}else if(state.mode==="rotate"){const deg=Number(el("rotation").value);canvas.width=(deg===90||deg===270)?h:w;canvas.height=(deg===90||deg===270)?w:h;ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(deg*Math.PI/180);ctx.drawImage(img,-w/2,-h/2,w,h);}else ctx.drawImage(img,0,0,w,h);const q=Number(el("quality").value)/100,out=await blob(canvas,type,q),ext=type==="image/jpeg"?"jpg":type.split("/")[1];outputBytes+=out.size;save(out,stem(normalized.name)+(state.mode==="compress"?"-compressed":state.mode==="resize"?"-resized":"")+"."+ext);canvas.width=0;canvas.height=0;img.src="";}const before=(inputBytes/1024/1024).toFixed(2),after=(outputBytes/1024/1024).toFixed(2),change=inputBytes?Math.round((1-outputBytes/inputBytes)*100):0;message("Done! "+before+" MB → "+after+" MB ("+(change>=0?change+"% smaller":Math.abs(change)+"% larger") +").");}
async function openPdf(file){if(!window.pdfjsLib)throw Error("PDF reader is loading. Try again shortly.");pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";return pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;}
async function pdfWork(){const pdf=await openPdf(state.files[0]);if(pdf.numPages>100)throw Error("This first version supports up to 100 pages per PDF.");const type=el("pdf-format").value;for(let p=1;p<=pdf.numPages;p++){message("Rendering page "+p+" of "+pdf.numPages+"…");const page=await pdf.getPage(p),view=page.getViewport({scale:1.5}),canvas=document.createElement("canvas");canvas.width=view.width;canvas.height=view.height;await page.render({canvasContext:canvas.getContext("2d"),viewport:view}).promise;save(await blob(canvas,type,.92),stem(state.files[0].name)+"-page-"+p+"."+(type==="image/jpeg"?"jpg":"png"));canvas.width=0;canvas.height=0;}}
async function pdfToPdf(){const JsPDF=window.jspdf?.jsPDF||window.jsPDF;if(!JsPDF)throw Error("PDF creator is not available. Refresh and try again.");const pdf=await openPdf(state.files[0]);if(pdf.numPages>100)throw Error("This first version supports up to 100 pages per PDF.");const quality=Number(el("pdf-quality").value)/100,maxEdge=Number(el("pdf-size").value);let doc=null;for(let p=1;p<=pdf.numPages;p++){message("Compressing PDF page "+p+" of "+pdf.numPages+"…");await new Promise(resolve=>setTimeout(resolve,20));const page=await pdf.getPage(p),base=page.getViewport({scale:1}),scale=Math.min(maxEdge/Math.max(base.width,base.height),2),view=page.getViewport({scale}),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.floor(view.width));canvas.height=Math.max(1,Math.floor(view.height));const ctx=canvas.getContext("2d");if(!ctx)throw Error("Could not render PDF page "+p);await page.render({canvasContext:ctx,viewport:view}).promise;const landscape=base.width>base.height;const orientation=landscape?"landscape":"portrait";if(!doc)doc=new JsPDF({orientation,unit:"pt",format:"a4",compress:true});else doc.addPage("a4",orientation);const pageW=595.28,pageH=841.89,currentW=landscape?pageH:pageW,currentH=landscape?pageW:pageH,margin=24,fit=Math.min((currentW-margin*2)/canvas.width,(currentH-margin*2)/canvas.height),w=canvas.width*fit,h=canvas.height*fit,x=(currentW-w)/2,y=(currentH-h)/2;doc.addImage(canvas.toDataURL("image/jpeg",quality),"JPEG",x,y,w,h,undefined,"FAST");canvas.width=0;canvas.height=0;page.cleanup();}if(!doc)throw Error("The PDF has no pages.");message("Saving optimized PDF…");doc.save(stem(state.files[0].name)+"-optimized.pdf");}

function parsePages(value,total){const set=new Set();(value||"").split(",").map(x=>x.trim()).filter(Boolean).forEach(part=>{const m=part.match(/^(\d+)\s*-\s*(\d+)$/);if(m){let a=Number(m[1]),b=Number(m[2]);if(a>b)[a,b]=[b,a];for(let n=a;n<=b;n++)if(n>=1&&n<=total)set.add(n-1);}else{const n=Number(part);if(Number.isInteger(n)&&n>=1&&n<=total)set.add(n-1);}});return [...set].sort((a,b)=>a-b);}
async function pdfLib(){if(!window.PDFLib)throw Error("PDF editing library is loading. Refresh and try again.");return window.PDFLib;}
async function mergePdfs(){const {PDFDocument}=await pdfLib();const out=await PDFDocument.create();for(let i=0;i<state.files.length;i++){message("Adding PDF "+(i+1)+" of "+state.files.length+"…");const src=await PDFDocument.load(await state.files[i].arrayBuffer());const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p));}save(new Blob([await out.save()],{type:"application/pdf"}),"merged.pdf");}
async function splitPdf(){const {PDFDocument}=await pdfLib();const src=await PDFDocument.load(await state.files[0].arrayBuffer());const ids=parsePages(el("pages").value,src.getPageCount());if(!ids.length)throw Error("Enter pages, for example 1-3,5.");const out=await PDFDocument.create(),copied=await out.copyPages(src,ids);copied.forEach(p=>out.addPage(p));save(new Blob([await out.save()],{type:"application/pdf"}),"split-pages.pdf");}
async function organizePdf(){const {PDFDocument,degrees}=await pdfLib();const src=await PDFDocument.load(await state.files[0].arrayBuffer());const total=src.getPageCount(),value=el("pages").value.trim();let order;if(value){order=value.split(",").map(x=>Number(x.trim())-1);if(order.some(n=>!Number.isInteger(n)||n<0||n>=total))throw Error("Use a comma-separated page order, e.g. 3,1,2. Omit pages to remove them.");}else order=src.getPageIndices();const out=await PDFDocument.create(),copied=await out.copyPages(src,order);copied.forEach(p=>out.addPage(p));const rotation=Number(el("rotation").value);out.getPages().forEach(p=>p.setRotation(degrees((p.getRotation().angle+rotation)%360)));save(new Blob([await out.save()],{type:"application/pdf"}),"organized.pdf");}
async function imagesPdf(){
  const JsPDF=window.jspdf?.jsPDF||window.jsPDF;
  if(!JsPDF)throw Error("PDF creator is not available. Refresh the page and try again.");
  if(!state.files.length)throw Error("Choose at least one image.");
  const pageW=595.28,pageH=841.89,margin=28;
  const quality=Number(el("pdf-quality").value)/100;
  const maxEdge=Number(el("pdf-size").value);
  let doc=null;
  for(let i=0;i<state.files.length;i++){
    const file=state.files[i];
    message("Compressing image "+(i+1)+" of "+state.files.length+"…");
    await new Promise(resolve=>setTimeout(resolve,30));
    const normalized=await normalizeImage(file);let img=await loadImage(normalized.blob);
    const naturalW=img.naturalWidth||img.width,naturalH=img.naturalHeight||img.height;
    if(!naturalW||!naturalH)throw Error("Image has invalid dimensions: "+file.name);
    const orientation=naturalW>naturalH?"landscape":"portrait";
    if(!doc)doc=new JsPDF({orientation,unit:"pt",format:"a4",compress:true});
    else doc.addPage("a4",orientation);
    const currentW=orientation==="landscape"?pageH:pageW;
    const currentH=orientation==="landscape"?pageW:pageH;
    const maxW=currentW-margin*2,maxH=currentH-margin*2;
    const fit=Math.min(maxW/naturalW,maxH/naturalH);
    const placeW=naturalW*fit,placeH=naturalH*fit;
    const rasterScale=Math.min(maxEdge/naturalW,maxEdge/naturalH,1);
    const outW=Math.max(1,Math.round(naturalW*rasterScale));
    const outH=Math.max(1,Math.round(naturalH*rasterScale));
    const canvas=document.createElement("canvas");
    canvas.width=outW;canvas.height=outH;
    const ctx=canvas.getContext("2d");
    if(!ctx)throw Error("Could not prepare image: "+file.name);
    ctx.fillStyle="#fff";ctx.fillRect(0,0,outW,outH);
    ctx.drawImage(img,0,0,outW,outH);
    const dataUrl=canvas.toDataURL("image/jpeg",quality);
    const x=(currentW-placeW)/2,y=(currentH-placeH)/2;
    doc.addImage(dataUrl,"JPEG",x,y,placeW,placeH,undefined,"FAST");
    canvas.width=0;canvas.height=0;
    img.src="";img=null;
  }
  if(!doc)throw Error("No valid images were selected.");
  message("Creating compressed PDF…");
  doc.save("converted-images.pdf");
}
convert.addEventListener("click",async()=>{convert.disabled=true;convert.textContent="Working…";try{if(state.mode==="pdf")await pdfWork();else if(state.mode==="pdfpdf"||state.mode==="pdfcompress")await pdfToPdf();else if(state.mode==="imagepdf")await imagesPdf();else if(state.mode==="pdfmerge")await mergePdfs();else if(state.mode==="pdfsplit")await splitPdf();else if(state.mode==="pdforganize")await organizePdf();else if(state.mode==="pdfextract")await pdfWork();else await imageWork();if(state.mode.startsWith("pdf"))message("Done! Your download is ready.");}catch(e){message(e.message||"Conversion failed.",true);}finally{convert.textContent="Convert now →";convert.disabled=!state.files.length;}});
el("browse").onclick=e=>{e.stopPropagation();input.click()};drop.onclick=()=>input.click();drop.onkeydown=e=>{if(e.key==="Enter")input.click()};input.onchange=()=>{add(input.files);input.value=""};
["dragenter","dragover"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.add("drag")}));["dragleave","drop"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.remove("drag")}));drop.addEventListener("drop",e=>add(e.dataTransfer.files));
el("quality").oninput=()=>el("quality-value").textContent=el("quality").value+"%";el("pdf-quality").oninput=()=>el("pdf-quality-value").textContent=el("pdf-quality").value+"%";
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>mode(b.dataset.mode)));
el("year").textContent=new Date().getFullYear();mode("image");
})();