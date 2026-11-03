# Convertly

A responsive, browser-based image and PDF converter.

## Included tools
- Image conversion to PNG, JPG and WEBP
- Image compression with quality control
- Image resizing with aspect-ratio preservation
- PDF pages to PNG or JPG (PDF.js)
- Multiple images to one PDF (jsPDF)

## Run locally
Open `index.html` in a modern browser, or serve this folder with a static web server.

## Publish with GitHub Pages
1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. The included workflow deploys the site automatically after each push to `main`.
4. When the workflow succeeds, the public site will be:
   https://nurlan-bagirli.github.io/converter/

## Privacy and limitations
Image and PDF work is performed in the browser; files are not uploaded to a Convertly backend. PDF.js and jsPDF are loaded from a public CDN. PDF export supports up to 100 pages in this initial version. Word, Excel, audio and video conversion are not included yet.
