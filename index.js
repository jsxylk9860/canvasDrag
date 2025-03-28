function initCanvas(firstArea, nextArea, lineWidth) {
  this.ctx.strokeRect(
    firstArea.startX,
    firstArea.startY,
    firstArea.width,
    firstArea.height
  );
  this.drawLine(
    firstArea.width,
    firstArea.height,
    firstArea.startX,
    firstArea.startY
  );
  this.ctx.strokeRect(
    nextArea.startX,
    nextArea.startY,
    nextArea.width,
    nextArea.height
  );
  this.drawLine(
    nextArea.width,
    nextArea.height,
    nextArea.startX,
    nextArea.startY
  );
  this.ctx.lineWidth = lineWidth || 0.5;
  this.ctx.font = "10px Arial";
  this.tagBox(
    firstArea.startX,
    firstArea.startY,
    this.canvas.offsetWidth,
    this.canvas.offsetHeight
  );
  this.mouseEventRegist();
}

function drawLine(canvasWidth, canvasHeight, startX, startY) {
  if (arguments.length !== 4) throw new Error("参数缺失");
  if (canvasWidth % this.gap) throw new Error("列间隔必须能被宽度整除");
  if (canvasHeight % this.gap) throw new Error("行间隔必须能被高度整除");

  const cols = canvasWidth / this.gap;
  const rows = canvasHeight / this.gap;
  // 绘制列数
  for (let i = 0; i < cols - 1; i++) {
    this.ctx.beginPath();
    this.ctx.moveTo(startX + (i + 1) * this.gap, startY);
    this.ctx.lineTo(startX + (i + 1) * this.gap, startY + canvasHeight);
    this.ctx.stroke();
  }
  // 绘制行数
  for (let i = 0; i < rows - 1; i++) {
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY + (i + 1) * this.gap);
    this.ctx.lineTo(startX + canvasWidth, startY + (i + 1) * this.gap);
    this.ctx.stroke();
  }
}

// 判断拖动的物品所匹配到的方块
function boxBelong(startX, startY, rows, cols, id, isDrop = false) {
  const colsAll = this.canvasWidth / this.gap; // 总列数
  const rowsAll = this.canvasHeight / this.gap; // 总行数

  let targetX, targetY;
  outerLoop: for (let i = 0; i < rowsAll; i++) {
    for (let j = 0; j < colsAll; j++) {
      const [boxStartX, boxStartY] = [j * this.gap, i * this.gap];
      const [boxEndX, boxEndY] = [(j + 1) * this.gap, (i + 1) * this.gap];
      if (
        startX >= boxStartX &&
        startX < boxEndX &&
        startY >= boxStartY &&
        startY < boxEndY
      ) {
        targetX = boxStartX;
        targetY = boxStartY;
        break outerLoop;
      }
    }
  }
  const {
    startX: fStartX,
    startY: fStartY,
    width: fWidth,
    height: fHeight,
  } = this.firstArea;
  const {
    startX: nStartX,
    startY: nStartY,
    width: nWidth,
    height: nHeight,
  } = this.nextArea;

  if (
    !(
      targetX >= fStartX &&
      targetX + cols * this.gap <= fStartX + fWidth &&
      targetY >= fStartY &&
      targetY + rows * this.gap <= fStartY + fHeight
    ) &&
    !(
      targetX >= nStartX &&
      targetX + cols * this.gap <= nStartX + nWidth &&
      targetY >= nStartY &&
      targetY + rows * this.gap <= nStartY + nHeight
    )
  ) {
    return false;
  }

  if (isDrop) {
    const canChange = this.canChange(targetX, targetY, rows, cols, id);
    if (!canChange) return;
  }
  return {
    startX: targetX,
    startY: targetY,
    endX: targetX + cols * this.gap,
    endY: targetY + rows * this.gap,
  };
}

// 是否可交换
function canChange(startX, startY, rows, cols, id) {
  const startRow = startY / this.gap; // 起始行索引
  const startCol = startX / this.gap; // 起始列索引

  const idSet = new Set();
  for (let i = startRow; i < startRow + rows; i++) {
    for (let j = startCol; j < startCol + cols; j++) {
      this.boxTag[i][j].id && idSet.add(this.boxTag[i][j].id);
    }
  }
  idSet.delete(id); // 删除自身

  // 遍历所有标签，排除上面以匹配的标签，寻找命中之外是否存在已匹配到的id
  for (let i = 0; i < this.boxTag.length; i++) {
    for (let j = 0; j < this.boxTag[i].length; j++) {
      if (
        i >= startRow &&
        i < startRow + rows &&
        j >= startCol &&
        j < startCol + cols
      )
        continue;
      if (idSet.has(this.boxTag[i][j].id)) return false;
    }
  }
  this.lastBeChangedImgId = [...idSet];
  return true;
}

// 绘制背景色
function drawBgColr(startX, startY, rows, cols, fillColor, lineColor) {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fillRect(
        startX + j * this.gap,
        startY + i * this.gap,
        this.gap,
        this.gap
      );

      this.ctx.strokeStyle = lineColor;
      this.ctx.lineWidth = 0.5;
      this.ctx.strokeRect(
        startX + j * this.gap,
        startY + i * this.gap,
        this.gap,
        this.gap
      );
    }
  }
}

// 给方框打标
function tagBox(startX, startY, width, height) {
  const cols = width / this.gap;
  const rows = height / this.gap;
  for (let i = 0; i < rows; i++) {
    let temp = [];
    for (let j = 0; j < cols; j++) {
      temp.push({
        id: "",
        startX: startX + j * this.gap,
        startY: startY + i * this.gap,
        endX: startX + (j + 1) * this.gap,
        endY: startY + (i + 1) * this.gap,
      });
    }
    this.boxTag.push(temp);
  }
}

// 更新标记
function updateTag(startX, startY, endX, endY, id) {
  this.boxTag.forEach((item) => {
    item.forEach((sItem) => {
      if (id === sItem.id) sItem.id = "";
      if (
        sItem.startX >= startX &&
        sItem.endX <= endX &&
        sItem.startY >= startY &&
        sItem.endY <= endY
      ) {
        sItem.id = id;
      }
    });
  });
}

/**
 * 绘制图片
 * @param src {string} 图片路径
 * @param startX {number} 起始横坐标
 * @param startY {number} 起始纵坐标
 * @param cols {number} 图片所占列数
 * @param rows {number} 图片所占行数
 *
 */
function drawImg(src, startX, startY, cols, rows, id) {
  const width = cols * this.gap;
  const height = rows * this.gap;
  const endX = startX + width;
  const endY = startY + height;

  // 记录图片放上前原始区域像素集
  const originArea = this.ctx.getImageData(startX, startY, width, height);
  const img = new Image();
  img.src = src;

  img.onload = () => {
    this.drawBgColr(startX, startY, rows, cols, "#FFA07A", "#000000");
    this.ctx.drawImage(img, startX, startY, width, height);

    this.updateTag(startX, startY, endX, endY, id);

    console.log(this.boxTag);
    // 备份当前图片
    originImg = img;

    // 记录绘制的图片坐标范围
    this.recordImgPos.push({
      originArea,
      originImg,
      startX,
      startY,
      endX,
      endY,
      width,
      height,
      cols,
      rows,
      id,
    });
  };
}

function mouseEventRegist() {
  let isDown = false;
  let matched;
  let prevFpsData;
  this.canvas.addEventListener("mousedown", (e) => {
    isDown = true;
    const realPosX = e.pageX;
    const realPosY = e.pageY;
    // 匹配符合范围的数据
    matched = this.recordImgPos.find((item) => {
      return (
        item.startX < realPosX &&
        item.endX > realPosX &&
        item.startY < realPosY &&
        item.endY > realPosY
      );
    });
    if (matched) {
      // 记录移动前的图像
      prevFpsData = this.ctx.getImageData(
        0,
        0,
        this.canvasWidth,
        this.canvasHeight
      );

      this.ctx.drawImage(
        matched.originImg,
        realPosX - matched.width / 2,
        realPosY - matched.height / 2,
        matched.width,
        matched.height
      );
    }
  });

  // 解决鼠标右击canvas不清除的bug
  this.canvas.addEventListener("contextmenu", (e) => {
    event.preventDefault();
    this.ctx.putImageData(prevFpsData, 0, 0);
  });

  this.canvas.addEventListener("mousemove", (e) => {
    if (isDown && matched) {
      // this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.putImageData(prevFpsData, 0, 0);

      const halfWidth = matched.width / 2;
      const halfHeight = matched.height / 2;
      const startX = e.pageX - halfWidth; // 起始横坐标
      const startY = e.pageY - halfHeight; // 起始纵坐标

      const res = this.boxBelong(
        startX,
        startY,
        matched.rows,
        matched.cols,
        matched.id
      );
      if (res) {
        this.drawBgColr(
          res.startX,
          res.startY,
          matched.rows,
          matched.cols,
          "rgba(0, 0, 0, 0.2)",
          "transparent"
        );
      }
      this.ctx.drawImage(
        matched.originImg,
        e.pageX - halfWidth,
        e.pageY - halfHeight,
        matched.width,
        matched.height
      );
    }
  });

  this.canvas.addEventListener("mouseup", (e) => {
    isDown = false;
    if (matched) {
      // this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.putImageData(prevFpsData, 0, 0);

      const halfWidth = matched.width / 2;
      const halfHeight = matched.height / 2;
      const startX = e.pageX - halfWidth; // 起始横坐标
      const startY = e.pageY - halfHeight; // 起始纵坐标

      const res = this.boxBelong(
        startX,
        startY,
        matched.rows,
        matched.cols,
        matched.id,
        true
      );
      if (res) {
        // 如果可以放置
        // 记录被替换区域的图像
        const isTargetAreaHasImg = this.lastBeChangedImgId.length; // 替换的目标区域是否存在图片


        // 记录图片的位移距离
        const moveX = res.startX - matched.startX;
        const moveY = res.startY - matched.startY;

        let moveEnough = true;
        if (Math.abs(moveX) < matched.width && Math.abs(moveY) < matched.height) {
          moveEnough = false;
        }
        // console.log(moveEnough)
        // console.log(this.lastBeChangedImgId)
        if (isTargetAreaHasImg && !moveEnough) return;
        const beChangedArea = isTargetAreaHasImg
          ? this.ctx.getImageData(
              res.startX,
              res.startY,
              matched.width,
              matched.height
            )
          : matched.originArea;

        this.updateTag(
          res.startX,
          res.startY,
          res.startX + matched.cols * this.gap,
          res.startY + matched.rows * this.gap,
          matched.id
        );

        this.lastBeChangedImgId.forEach((id) => {
          const target = this.recordImgPos.find((item) => item.id === id);
          if (target) {
            // 更新图片位置信息
            target.startX -= moveX;
            target.startY -= moveY;
            target.endX -= moveX;
            target.endY -= moveY;

            // 更新标签信息
            this.boxTag.forEach((item) => {
              item.forEach((sItem) => {
                if (
                  sItem.startX >= target.startX &&
                  sItem.startY >= target.startY &&
                  sItem.endX <= target.endX &&
                  sItem.endY <= target.endY
                ) {
                  sItem.id = id;
                }
              });
            });
          }
        });

        this.lastBeChangedImgId = []; // 清除记录

        // console.log(this.boxTag);
        // console.log(this.recordImgPos);
        this.ctx.putImageData(beChangedArea, matched.startX, matched.startY);
        this.drawBgColr(
          res.startX,
          res.startY,
          matched.rows,
          matched.cols,
          "#FFA07A",
          "#000000"
        );
        Object.assign(matched, res); // 更新图片缓存数据
        this.ctx.drawImage(
          matched.originImg,
          res.startX,
          res.startY,
          matched.width,
          matched.height
        );
      }
    }
  });
}

/**
 * 构造函数
 * @param el {dom} 容器
 * @param firstArea {object} 起始区域参数
 * @param nextArea {object} 下一个区域参数
 * @param gap {number} 间隔
 * @param lineWidth {number} 线宽
 *
 */
function BagDrag(el, firstArea, nextArea, gap, lineWidth) {
  this.canvas = el;
  this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
  this.canvasWidth = this.canvas.offsetWidth;
  this.canvasHeight = this.canvas.offsetHeight;
  this.firstArea = firstArea;
  this.nextArea = nextArea;
  this.gap = gap;
  this.recordImgPos = [];
  this.boxTag = [];
  this.lastBeChangedImgId = []; // 最近一次被替换的图片id
  this.initCanvas(firstArea, nextArea, lineWidth);
}

BagDrag.prototype = {
  initCanvas,
  drawImg,
  drawLine,
  mouseEventRegist,
  drawBgColr,
  updateTag,
  boxBelong,
  tagBox,
  canChange,
};
BagDrag.prototype.constructor = BagDrag;
