"""Analyse a pinned reference into vector contours and a local camera fit.

No raster retouching or generated raster assets: outputs are JSON, SVG and numerical fits.
Usage: python trace-reference.py /path/to/original.jpg
Dependencies: numpy, opencv-python-headless (versions recorded in generated report).
"""
from pathlib import Path
import hashlib, json, sys
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
SHA = 'eebdbe096e5aeecc55d08e380775171438c75b635846dc013c452bce55f36c1c'
SOURCE = 'https://img.dpm.org.cn/Uploads/Picture/2020/07/03/s5efefbd5093a9.jpg'
raw = Path(sys.argv[1]).read_bytes()
if hashlib.sha256(raw).hexdigest() != SHA:
    raise RuntimeError('Reference bytes changed; review the source before retracing')
image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
assert image.shape[:2] == (1500, 1000)
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
H, S, V = [hsv[:, :, i] for i in range(3)]
gold = ((H >= 12) & (H <= 43) & (S >= 65) & (V >= 55)).astype(np.uint8)

def polygon_mask(points):
    mask = np.zeros((1500, 1000), np.uint8)
    cv2.fillPoly(mask, [np.array(points, np.int32)], 1)
    return mask

def contours(mask, minimum=4, epsilon=.65):
    cs, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if hierarchy is None:
        return []
    result = []
    for i, c in enumerate(cs):
        if hierarchy[0][i][3] != -1 or cv2.contourArea(c) < minimum:
            continue
        outer = cv2.approxPolyDP(c, epsilon, True)[:, 0, :].tolist()
        if len(outer) < 3:
            continue
        holes = []
        child = hierarchy[0][i][2]
        while child != -1:
            if cv2.contourArea(cs[child]) >= 2:
                hole = cv2.approxPolyDP(cs[child], epsilon, True)[:, 0, :].tolist()
                if len(hole) >= 3:
                    holes.append(hole)
            child = hierarchy[0][child][0]
        result.append({'outer': outer, 'holes': holes})
    return result

glyph_mask = polygon_mask([[365, 539], [625, 539], [625, 1030], [365, 1030]])
glyphs = contours(gold * glyph_mask, minimum=28, epsilon=.55)

# The full photographed crest, scalloped sides and lower apron, manually read in pixels.
frame = [[42,462],[88,453],[147,444],[196,443],[235,435],[285,443],[329,456],[370,458],
 [414,443],[469,435],[501,438],[553,433],[596,445],[642,458],[680,455],[717,443],
 [767,436],[815,447],[873,445],[909,456],[950,461],[960,479],[944,496],[901,506],
 [855,509],[809,502],[790,522],[803,550],[793,576],[809,602],[813,630],[805,653],
 [820,681],[825,710],[815,741],[827,770],[828,803],[821,830],[832,862],[825,895],
 [820,925],[804,955],[800,983],[789,1004],[805,1027],[803,1063],[818,1091],
 [820,1132],[829,1173],[828,1215],[816,1244],[801,1246],[796,1270],[779,1280],
 [760,1264],[750,1228],[728,1194],[721,1150],[705,1140],[681,1150],[662,1154],
 [648,1144],[610,1165],[565,1177],[507,1180],[455,1171],[408,1156],[380,1143],
 [358,1150],[337,1149],[316,1134],[293,1145],[278,1161],[272,1201],[254,1235],
 [244,1265],[228,1277],[213,1271],[205,1247],[186,1238],[175,1206],[172,1174],
 [173,1135],[182,1102],[192,1065],[195,1035],[178,1008],[175,979],[166,947],
 [163,916],[165,884],[154,854],[153,821],[159,791],[155,760],[164,731],[162,701],
 [172,675],[173,645],[184,619],[183,588],[195,562],[196,533],[212,512],[194,500],
 [150,506],[104,507],[62,500],[40,485]]
frame_mask = polygon_mask(frame)
field_mask = polygon_mask([[286,520],[710,520],[712,1048],[284,1048]])
trim_gold=((H>=14)&(H<=43)&(S>=45)&(V>=45)).astype(np.uint8)
trim_mask = trim_gold * frame_mask * (1-field_mask)
trim = contours(trim_mask, minimum=10, epsilon=.7)
left = [[0,781],[171,785],[161,824],[160,874],[169,923],[179,970],[197,1009],[194,1088],[0,1088]]
right = [[829,781],[999,781],[999,1088],[810,1088],[799,1030],[810,977],[822,921],[833,860]]
paint_mask = np.maximum(polygon_mask(left), polygon_mask(right))
paint = {
    'gold': contours(gold * paint_mask, minimum=4, epsilon=.6),
    'blue': contours(((H>=100)&(H<=135)&(S>=70)&(V>=28)).astype(np.uint8)*paint_mask, minimum=12),
    'green': contours(((H>=65)&(H<100)&(S>=50)&(V>=25)).astype(np.uint8)*paint_mask, minimum=12),
}
# Visible bright ridges on one photographed dragon roundel, not a depth scan.
disk = np.zeros_like(gold)
cv2.circle(disk, (431,285), 23, 1, -1)
relief_mask = ((V>=136)&(H>=10)&(H<=42)&(S>=50)).astype(np.uint8)*disk
relief = contours(relief_mask, minimum=3, epsilon=.4)

scale=.0041
origin=[500,800]
position=[0,12.65,15.45]
front_z=15.737
def world(px,py):
    return [(px-origin[0])*scale,position[1]+(origin[1]-py)*scale,front_z]

# Calibrate only the plaque plane, keeping intrinsics explicit. Four image points
# are manually located; the physical field size is a proportional hypothesis.
pixels=np.array([[286,520],[710,520],[712,1048],[284,1048]],np.float64)
points=np.array([world(285,520),world(711,520),world(711,1048),world(285,1048)],np.float64)
fov=35.
focal=1500/(2*np.tan(np.deg2rad(fov/2)))
K=np.array([[focal,0,500],[0,focal,750],[0,0,1]],np.float64)
ok,rv,tv=cv2.solvePnP(points,pixels,K,None,flags=cv2.SOLVEPNP_ITERATIVE)
assert ok
rv,tv=cv2.solvePnPRefineLM(points,pixels,K,None,rv,tv)
R=cv2.Rodrigues(rv)[0]
camera=(-R.T@tv).ravel()
forward=R.T@np.array([0,0,1.])
up=R.T@np.array([0,-1.,0])
target=camera+forward*np.linalg.norm(camera-np.array(world(498,784)))
projected=cv2.projectPoints(points,rv,tv,K,None)[0][:,0,:]
errors=np.linalg.norm(projected-pixels,axis=1)
hold_pixels=np.array([[498,520],[498,1048]],np.float64)
hold_world=np.array([world(498,520),world(498,1048)])
hold_projected=cv2.projectPoints(hold_world,rv,tv,K,None)[0][:,0,:]
hold_errors=np.linalg.norm(hold_projected-hold_pixels,axis=1)
# Roof samples are not part of the fit and expose remaining model mismatch.
context_world=np.array([[0,14.7,16.5],[0,10.7,13.0224]],np.float64)
context_pixels=cv2.projectPoints(context_world,rv,tv,K,None)[0][:,0,:]

result={'schema':'taihe-reference-vectors/v1','source':SOURCE,'sha256':SHA,'imageSize':[1000,1500],
 'method':'HSV segmentation + manually delimited regions + contour simplification; no raster shadow texture',
 'scale':scale,'origin':origin,'position':position,'frontZ':front_z,
 'field':[[286,520],[710,520],[712,1048],[284,1048]],'frame':frame,'glyphs':glyphs,'trim':trim,
 'paint':paint,'paintRegions':[left,right],'relief':{'centre':[431,285],'radius':23,'shapes':relief},
 'limits':['局部字形与可见纹样轮廓；非三维扫描','雕刻高度与绝对比例推定','遮挡区域未补绘','瓦当浮雕仅依据可见亮脊，深度未测量'],
 'calibration':{'kind':'local planar pose fit, fixed 35 degree vertical FOV','fov':fov,'position':camera.tolist(),
 'target':target.tolist(),'up':up.tolist(),'intrinsics':K.tolist(),'fitWorld':points.tolist(),'fitPixels':pixels.tolist(),
 'reprojected':projected.tolist(),'rmsPixels':float(np.sqrt(np.mean(errors**2))),
 'holdoutWorld':hold_world.tolist(),'holdoutPixels':hold_pixels.tolist(),'holdoutProjected':hold_projected.tolist(),
 'holdoutRmsPixels':float(np.sqrt(np.mean(hold_errors**2))),
 'contextWorld':context_world.tolist(),'contextProjected':context_pixels.tolist(),
 'limits':'只配准匾额正面局部；物理尺度推定；周边屋面未参与拟合，不能当整殿测绘认证'},
 'software':{'numpy':np.__version__,'opencv':cv2.__version__},
 'counts':{'glyphRegions':len(glyphs),'frameTrimRegions':len(trim),'paintGoldRegions':len(paint['gold']),'reliefRegions':len(relief)}}
out=ROOT/'assets'
out.mkdir(exist_ok=True)
(out/'reference-vectors.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
# Preserve an unmodified, hash-pinned local research reference for offline overlays.
(out/'reference-photo.jpg').write_bytes(raw)

def path_for(shapes):
    return ' '.join('M'+' L'.join(f'{x},{y}' for x,y in ring)+'Z' for shape in shapes for ring in [shape['outer'],*shape['holes']])
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1500">',
 '<rect width="1000" height="1500" fill="#212720"/>',
 '<path d="M'+' L'.join(f'{x},{y}' for x,y in frame)+'Z" fill="#70392a"/>',
 '<path d="M286,520H710L712,1048H284Z" fill="#163f99"/>']
for name,color,shapes in [('letters','#d4b771',glyphs),('frame','#b39358',trim),('paint-blue','#173e75',paint['blue']),('paint-green','#244e49',paint['green']),('paint-gold','#c0a15c',paint['gold'])]:
    svg.append(f'<path id="{name}" d="{path_for(shapes)}" fill="{color}" fill-rule="evenodd"/>')
svg.append('</svg>')
(out/'reference-trace.svg').write_text('\n'.join(svg))
print(json.dumps({'counts':result['counts'],'rmsPixels':result['calibration']['rmsPixels'],
 'holdoutRmsPixels':result['calibration']['holdoutRmsPixels'],'contextProjected':context_pixels.tolist()},ensure_ascii=False,indent=2))
