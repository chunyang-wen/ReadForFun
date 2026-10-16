# 第三轮：从原照轮廓到可重放模型

配置 `experiment.json` 的 revision 为 `03`。本轮不更改共用重放接口；其他卷继续使用原 runner。太和殿增加 `reference-detail.js`、`trace-reference.py`、`replay-detail.mjs` 和独立参考资产。

## 1. 原图和区域

来源：故宫官方太和殿近照，URL与SHA-256已写入 `assets/reference-vectors.json`。原图尺寸1000×1500；`https://readforfun-img.chunyangwen.com/chinese-architecture/taihe/study/assets/eebdbe096e5aeecc/reference-photo.jpg`是原始字节研究副本，没有裁剪或修图。位于原图上的点位都采用左上角为原点、像素为单位。

脚本明确保存以下选择，其他建筑应重新选取，不能沿用太和殿像素坐标：

- 字形区域、金色阈值与轮廓简化误差；字内空洞保留为Shape holes。
- 匾框外轮廓的手工点列及描金提取区域。
- 仅限照片可见的两侧彩画区域，分离青蓝、青绿和金色轮廓。
- 一枚瓦当的亮脊区域；只生成可见轮廓和推定凸高，不补出被阴影掩盖的雕刻深度。
- 匾额平面4个拟合点、2个同平面边缘检查点；固定35°垂直FOV，相机内参、姿态和重投影结果完整写出。

## 2. 重建轮廓与相机

需要Python、NumPy与OpenCV。版本要求在 `trace-requirements.txt`。可在临时环境安装这些公开包，避免修改项目或系统Python：

```sh
python3 -m venv /tmp/taihe-trace-env
/tmp/taihe-trace-env/bin/pip install -r chinese-architecture/taihe/study/trace-requirements.txt
/tmp/taihe-trace-env/bin/python chinese-architecture/taihe/study/trace-reference.py chinese-architecture/taihe/study/assets/reference-photo.jpg
```

脚本先验证原图哈希；不一致时停止，不静默改用新图。输出 `reference-vectors.json`、`reference-trace.svg` 和未改变字节的参考副本。原始照片、轮廓参数或相机点位变化后，需要重新生成并核对SVG，再更新版本和下游预设视角，不能只修改误差报告。

SVG与三维几何沿用实际笔画边界，没有调用字体替代。三维使用独立颜色和材质，厚度/凸高为推定；不把原照光影直接烘焙成所谓真实材质。

## 3. 自动检查

```sh
node chinese-architecture/realism-workflow/verify.mjs chinese-architecture/taihe/study/experiment.json
```

命令创建新时间戳证据目录并打印绝对路径，保存完整配置、源码SHA-256、原始测试日志和运行环境。本轮最终37项通过。`reference.test.js`特别检查：原图字节、三个字的区域、字内孔洞保留、薄浮雕顶点有效、相机坐标约定一致、相机偏移会被检测、装饰和瓦当的图层归属。

## 4. 浏览器重放

启动或复用本地8765静态服务，在Codex的cua_repl按工具说明打开：

`http://localhost:8765/chinese-architecture/taihe/study/?mode=e&view=photo`

使用 [共用重放说明](../../realism-workflow/README.md) 的相同绑定步骤，取好 `tab` 和 `browser`。将其示例中的 runner 改为：

```js
const {replayDetail} = await import('file://' + repo + '/chinese-architecture/taihe/study/replay-detail.mjs');
const report = await replayDetail(tab, config,
  (name, bytes) => fs.writeFile(out + '/' + device + '/' + name, bytes),
  {viewport:device});
```

页面开始应处于 `view=photo`，因为叠加滑杆在该视角才可操作。先设配置中的桌面尺寸，重载并读取页面状态，再重放；手机尺寸同样重载。执行结束在finally中恢复浏览器视口。

每种设备执行14个配置条件及3档叠加。除了原有条件、视口、溢出和错误检查，还验证参考图成功加载、CSS透明度与滑杆值一致、匾额平面的投影残差小于2像素。本轮正式证据在 `runs/03/`；截图、桌面/手机JSON、测试日志和源码校验记录均可交叉核对。

## 5. 判读范围

“照片配准”使用固定FOV和推定物理尺寸，只解决局部匾额平面的姿态；正面字形和彩画轮廓来自同一张原照。2个边缘点也在同一平面，不是独立相机验证。不能将约0.05像素的数值残差说成建筑尺寸精度，也不能由此认证周边屋顶和整殿。

移用到其他建筑时，需要重新登记来源、图像阶段与使用范围，重新划定轮廓区域和控制点，采用该建筑自己的尺度、屋面与构件ID。复用分析、几何和验证方法，不复用太和殿的匾字或龙纹。
