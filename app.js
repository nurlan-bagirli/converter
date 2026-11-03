(() => {
const el=id=>document.getElementById(id);
const state={mode:"image",files:[]};
const input=el("files"),drop=el("drop"),convert=el("convert");
const modes={
image:{title:"Image converter",desc:"Convert images to PNG, JPG or WEBP.",accept:"image/*",multiple:true,formats:[["image/png","PNG"],["image/jpeg","JPG"],["image/webp","WEBP"]]},
compress:{title:"Image compressor",desc:"Reduce image file size with quality control.",accept:"image/*",multiple:true,formats:[["image/webp","WEBP"],["image/jpeg","JPG"]]},
resize:{title:"Image resizer",desc:"Resize images while preserving proportions.",accept:"image/*",multiple:true,formats:[["image/png","PNG"],["image/jpeg","JPG"],["image/webp","WEBP"]]},
pdf:{title:"PDF to image",desc:"Export PDF pages as PNG or JPG files.",accept:".pdf,application/pdf",multiple:false,formats:[["image/png","PNG"],["image/jpeg","JPG"]]},
imagepdf:{title:"Image to PDF",desc:"Combine JPG, PNG, WEBP and HEIC images into one compressed PDF.",accept:"image/*,.heic,.heif",multiple:true,formats:[["application/pdf","PDF"]]},
pdfpdf:{title:"PDF to PDF optimizer",desc:"Rebuild a PDF as a compressed, image-based PDF. Text will not remain selectable.",accept:".pdf,application/pdf",multiple:false,formats:[["application/pdf","PDF"]]}
};
function message(text,error=false){el("status").textContent=text;el("status").style.color=error?"#c44":"#278b69";}
function mode(name){state.mode=name;state.files=[];const m=modes[name];el("tool-title").textContent=m.title;el("tool-desc").textContent=m.desc;input.accept=m.accept;input.multiple=m.multiple;el("format").innerHTML=m.formats.map(f=>'<option value="'+f[0]+'">'+f[1]+'</option>').join("");el("quality-label").hidden=!["image","compress"].includes(name);el("resize-label").hidden=name!=="resize";el("pdf-format-label").hidden=name!=="pdf";el("pdf-quality-label").hidden=!(name==="imagepdf"||name==="pdfpdf");el("pdf-size-label").hidden=!(name==="imagepdf"||name==="pdfpdf");el("pdf-raster-note").hidden=name!=="pdfpdf";el("format-label").hidden=name==="pdf"||name==="pdfpdf";el("file-hint").textContent=(name==="pdf"||name==="pdfpdf")?"PDF documents · Choose one PDF file":"Images · JPG, PNG, WEBP, HEIC and HEIF";render();message("");el("workspace").scrollIntoView({behavior:"smooth",block:"center"});}
function render(){el("file-list").innerHTML="";state.files.forEach((f,i)=>{const row=document.createElement("div");row.className="file-item";const n=document.createElement("span");n.textContent=f.name;const s=document.createElement("span");s.textContent=(f.size/1024/1024).toFixed(2)+" MB";const b=document.createElement("button");b.textContent="Remove";b.onclick=()=>{state.files.splice(i,1);render()};row.append(n,s,b);el("file-list").append(row)});convert.disabled=!state.files.length;}
function isPdf(f){return f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf");}
function isImage(f){const name=(f.name||"").toLowerCase();const type=(f.type||"").toLowerCase();return type.startsWith("image/")||/\.(heic|heif|jpg|jpeg|png|webp|gif|bmp|tif|tiff|avif)$/i.test(name)||type.includes("heic")||type.includes("heif");}
function add(files){const pdfMode=state.mode==="pdf"||state.mode==="pdfpdf";const good=Array.from(files).filter(f=>pdfMode?isPdf(f):isImage(f));if(!good.length){message(pdfMode?"Please choose a PDF file.":"Choose an image, including HEIC or HEIF.",true);return;}state.files=pdfMode?good.slice(0,1):state.files.concat(good).slice(0,20);render();message("");}
async function normalizeImage(file){const name=(file.name||"image").toLowerCase();const type=(file.type||"").toLowerCase();const isHeic=/\.(heic|heif)$/i.test(name)||type.includes("heic")||type.includes("heif");if(isHeic){if(!window.heic2any)throw Error("HEIC decoder is still loading. Refresh the page and try again.");try{const converted=await window.heic2any({blob:file,toType:"image/jpeg",quality:0.92});const result=Array.isArray(converted)?converted[0]:converted;if(!(result instanceof Blob))throw Error("HEIC decoder returned an invalid image.");return {blob:result,name:(file.name||"image").replace(/\.(heic|heif)$/i,"")+".jpg"};}catch(err){throw Error("Could not decode this HEIC/HEIF file. Try another photo or export it as JPEG from your device.");}}return {blob:file,name:file.name||"image"};}
function loadImage(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Could not read image. HEIC/HEIF files need a supported browser and HEIC decoder."))};img.src=url;});}
function blob(canvas,type,q){return new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error("Could not create output.")),type,q));}
function save(data,name){const url=URL.createObjectURL(data),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);}
function stem(name){return name.replace(/\.[^.]+$/,"");}
async function imageWork(){for(const file of state.files){const normalized=await normalizeImage(file),img=await loadImage(normalized.blob),canvas=document.createElement("canvas");let w=img.naturalWidth,h=img.naturalHeight;if(state.mode==="resize"){const nw=Number(el("width").value),nh=Number(el("height").value);if(!nw&&!nh)throw Error("Enter a width or height.");if(nw&&nh){w=nw;h=nh}else if(nw){w=nw;h=Math.round(img.naturalHeight*nw/img.naturalWidth)}else{h=nh;w=Math.round(img.naturalWidth*nh/img.naturalHeight)}}canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d"),type=el("format").value;if(type==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h)}ctx.drawImage(img,0,0,w,h);const q=Number(el("quality").value)/100,out=await blob(canvas,type,q),ext=type==="image/jpeg"?"jpg":type.split("/")[1];save(out,stem(normalized.name)+(state.mode==="compress"?"-compressed":state.mode==="resize"?"-resized":"")+"."+ext);canvas.width=0;canvas.height=0;}}
async function openPdf(file){if(!window.pdfjsLib)throw Error("PDF reader is loading. Try again shortly.");pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";return pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;}
async function pdfWork(){const pdf=await openPdf(state.files[0]);if(pdf.numPages>100)throw Error("This first version supports up to 100 pages per PDF.");const type=el("pdf-format").value;for(let p=1;p<=pdf.numPages;p++){message("Rendering page "+p+" of "+pdf.numPages+"…");const page=await pdf.getPage(p),view=page.getViewport({scale:1.5}),canvas=document.createElement("canvas");canvas.width=view.width;canvas.height=view.height;await page.render({canvasContext:canvas.getContext("2d"),viewport:view}).promise;save(await blob(canvas,type,.92),stem(state.files[0].name)+"-page-"+p+"."+(type==="image/jpeg"?"jpg":"png"));canvas.width=0;canvas.height=0;}}
async function pdfToPdf(){const JsPDF=window.jspdf?.jsPDF||window.jsPDF;if(!JsPDF)throw Error("PDF creator is not available. Refresh and try again.");const pdf=await openPdf(state.files[0]);if(pdf.numPages>100)throw Error("This first version supports up to 100 pages per PDF.");const quality=Number(el("pdf-quality").value)/100,maxEdge=Number(el("pdf-size").value);let doc=null;for(let p=1;p<=pdf.numPages;p++){message("Compressing PDF page "+p+" of "+pdf.numPages+"…");await new Promise(resolve=>setTimeout(resolve,20));const page=await pdf.getPage(p),base=page.getViewport({scale:1}),scale=Math.min(maxEdge/Math.max(base.width,base.height),2),view=page.getViewport({scale}),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.floor(view.width));canvas.height=Math.max(1,Math.floor(view.height));const ctx=canvas.getContext("2d");if(!ctx)throw Error("Could not render PDF page "+p);await page.render({canvasContext:ctx,viewport:view}).promise;const landscape=base.width>base.height;const orientation=landscape?"landscape":"portrait";if(!doc)doc=new JsPDF({orientation,unit:"pt",format:"a4",compress:true});else doc.addPage("a4",orientation);const pageW=595.28,pageH=841.89,currentW=landscape?pageH:pageW,currentH=landscape?pageW:pageH,margin=24,fit=Math.min((currentW-margin*2)/canvas.width,(currentH-margin*2)/canvas.height),w=canvas.width*fit,h=canvas.height*fit,x=(currentW-w)/2,y=(currentH-h)/2;doc.addImage(canvas.toDataURL("image/jpeg",quality),"JPEG",x,y,w,h,undefined,"FAST");canvas.width=0;canvas.height=0;page.cleanup();}if(!doc)throw Error("The PDF has no pages.");message("Saving optimized PDF…");doc.save(stem(state.files[0].name)+"-optimized.pdf");}
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
convert.addEventListener("click",async()=>{convert.disabled=true;convert.textContent="Working…";try{if(state.mode==="pdf")await pdfWork();else if(state.mode==="pdfpdf")await pdfToPdf();else if(state.mode==="imagepdf")await imagesPdf();else await imageWork();message("Done! Your download is ready.");}catch(e){message(e.message||"Conversion failed.",true);}finally{convert.textContent="Convert now →";convert.disabled=!state.files.length;}});
el("browse").onclick=e=>{e.stopPropagation();input.click()};drop.onclick=()=>input.click();drop.onkeydown=e=>{if(e.key==="Enter")input.click()};input.onchange=()=>{add(input.files);input.value=""};
["dragenter","dragover"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.add("drag")}));["dragleave","drop"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.remove("drag")}));drop.addEventListener("drop",e=>add(e.dataTransfer.files));
el("quality").oninput=()=>el("quality-value").textContent=el("quality").value+"%";el("pdf-quality").oninput=()=>el("pdf-quality-value").textContent=el("pdf-quality").value+"%";
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>mode(b.dataset.mode)));
el("year").textContent=new Date().getFullYear();mode("image");
})();