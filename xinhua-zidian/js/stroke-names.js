/**
 * 汉字笔画名称智能识别算法模块
 * 结合国家语委《GB13000.1字符集汉字笔顺规范》与 HanziWriter 矢量骨架中位线轨迹
 */
(function() {
  const STROKE_BASIC_NAMES = {
    '1': '横',
    '2': '竖',
    '3': '撇',
    '4': '点',
    '5': '折'
  };

  /**
   * 根据 HanziWriter 的 medians 轨迹点智能判断笔画名称
   * @param {Array<Array<number>>} medians 轨迹点序列 [[x,y], ...]
   * @param {string} [codeChar] 笔顺编号字符 ('1'~'5')
   * @returns {string} 汉字标准笔画名（如 横、竖、撇、捺、点、提、横折钩、竖弯钩等）
   */
  function identifyStrokeName(medians, codeChar) {
    if (!medians || medians.length < 2) {
      return codeChar ? STROKE_BASIC_NAMES[codeChar] || '笔' : '笔';
    }

    const p0 = medians[0];
    const pn = medians[medians.length - 1];
    const totalDx = pn[0] - p0[0];
    const totalDy = pn[1] - p0[1]; // 在 HanziWriter 坐标系中，y向上为正，向下为负
    const totalDist = Math.hypot(totalDx, totalDy);

    // 计算轨迹弯折点（拐角）
    const turns = [];
    for (let i = 0; i < medians.length - 2; i++) {
      const v1 = [medians[i + 1][0] - medians[i][0], medians[i + 1][1] - medians[i][1]];
      const v2 = [medians[i + 2][0] - medians[i + 1][0], medians[i + 2][1] - medians[i + 1][1]];
      const len1 = Math.hypot(v1[0], v1[1]);
      const len2 = Math.hypot(v2[0], v2[1]);
      if (len1 > 12 && len2 > 12) {
        const dot = v1[0] * v2[0] + v1[1] * v2[1];
        const cosVal = Math.max(-1, Math.min(1, dot / (len1 * len2)));
        const deg = Math.acos(cosVal) * 180 / Math.PI;
        if (deg > 42) {
          turns.push({
            index: i + 1,
            point: medians[i + 1],
            deg: deg,
            v1: v1,
            v2: v2
          });
        }
      }
    }

    // 第一段的方向向量
    const startDx = medians[1][0] - medians[0][0];
    const startDy = medians[1][1] - medians[0][1];

    // 最后一段的方向向量（判断钩向）
    const endDx = pn[0] - medians[medians.length - 2][0];
    const endDy = pn[1] - medians[medians.length - 2][1];

    // 1. 如果有折转或钩
    if (turns.length >= 1 || codeChar === '5') {
      const isStartHoriz = Math.abs(startDx) > Math.abs(startDy) && startDx > 0;
      const isStartVert = startDy < 0 && Math.abs(startDy) > Math.abs(startDx);
      const isHookEnd = (endDy > 15 && endDx < 10) || (endDx < -15 && endDy > 0);

      if (turns.length >= 2) {
        if (isStartHoriz) return '横折弯钩';
        return '竖折折';
      }

      if (isStartHoriz) {
        // 横起笔
        if (isHookEnd || pn[1] > medians[medians.length - 2][1]) {
          return '横折钩';
        }
        if (totalDy < -30 && endDx < 0) {
          return '横撇';
        }
        if (totalDy < -30) {
          return '横折';
        }
        return '横钩';
      }

      if (isStartVert) {
        // 竖起笔
        if (isHookEnd || endDx < -10) {
          return '竖钩';
        }
        if (endDx > 20 && totalDy < -30) {
          return totalDy < -100 && endDy > 10 ? '竖弯钩' : '竖折';
        }
        if (endDy > 15 && endDx > 15) {
          return '竖提';
        }
        return '竖钩';
      }

      // 撇折 / 撇点
      if (startDx < 0 && startDy < 0) {
        return endDy > 0 ? '撇提' : '撇折';
      }

      // 默认折
      return '折';
    }

    // 2. 没有折转（单笔画：横/竖/撇/捺/点/提）
    // 判断提（往右上且短）
    if (startDx > 0 && startDy > 15 && totalDx > 0 && totalDy > 15) {
      return '提';
    }

    // 长度较短的通常为“点”
    if (totalDist < 170) {
      if (startDx < -20 && startDy < -20) return '撇';
      if (startDx > 20 && startDy > 20) return '提';
      return '点';
    }

    // 较长笔画
    if (Math.abs(totalDx) > Math.abs(totalDy) * 2.2) {
      return totalDx > 0 ? '横' : '横';
    }

    if (Math.abs(totalDy) > Math.abs(totalDx) * 2.2) {
      if (endDx < -15 && endDy > 10) return '竖钩';
      return '竖';
    }

    // 斜向笔画：左下为撇，右下为捺
    if (totalDx < 0 && totalDy < 0) {
      return '撇';
    }

    if (totalDx > 0 && totalDy < 0) {
      return codeChar === '4' && totalDist < 260 ? '点' : '捺';
    }

    // 结合标准编号代码 fallback
    if (codeChar && STROKE_BASIC_NAMES[codeChar]) {
      return STROKE_BASIC_NAMES[codeChar];
    }

    return '笔';
  }

  window.StrokeIdentifier = {
    identifyStrokeName: identifyStrokeName
  };
})();
