"""Serve preserved model bytes with reduced-motion/read-only DOM instrumentation.
Run from any folder; open http://localhost:8767/chinese-architecture/baohe/.
No saved baseline file is modified. Geometry/data responses are byte-for-byte copies.
"""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[4]
BASE=Path(__file__).parent/'baseline'
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  name=urlsplit(self.path).path.removeprefix('/chinese-architecture/baohe/').strip('/')
  if urlsplit(self.path).path.startswith('/chinese-architecture/baohe/') and name in ['', 'index.html','app.js','model.js','data.js']:
   name=name or 'index.html';data=(BASE/name).read_bytes()
   if name=='index.html':data=data.replace(b'src="app.js"',b'src="app.js?v=baseline-02-instrumented"')
   if name=='app.js':
    data=data.replace(b"const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;",b'const reduced=true; // Preview instrumentation only: stable final views.')
    data+=b"\n(function report(){if(camera&&activeModel){document.getElementById('viewport').dataset.settled=String(!animation);document.getElementById('viewport').dataset.viewerState=JSON.stringify(getViewerState());}requestAnimationFrame(report);})();\n"
   self.send_response(200);self.send_header('Content-Type','text/html' if name.endswith('.html') else 'text/javascript');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data);return
  super().do_GET()
 def log_message(self,*args):pass
ThreadingHTTPServer(('127.0.0.1',8767),lambda *args,**kwargs:Handler(*args,directory=str(ROOT),**kwargs)).serve_forever()
