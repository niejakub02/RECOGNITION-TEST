const box = document.querySelector('.input-box');
const loadingScreen = document.querySelector('.loading-screen');
const coord = { x: 0, y: 0 };
const canvasList = [];
const contextList = [];
let step = -1;
const resultsLi = document.querySelectorAll('.results-box > span');
// const charactersList = ['話', '夕', '悪', '明', '目', '無', '理', '道', '西', '京'];
const charactersList = [
    '亜', '唖', '娃', '阿', '哀', '愛', '挨', '姶', '逢', '葵', '茜', '穐', '飴', '姐', '虻', '飛', '疱', '靄', '愛', '曖', '靭', '宛', '嵐', '昂', '衿', '股', '胡', '弧', '狐', '玄', '県', '砿', '骨', '亀', '喰', '宮', '恭', '脅', '強', '恒', '洪', '硬', '肯', '侯', '喉', '紅', '荒', '硝', '鴻', '劫', '巨', '拒', '昆', '崑', '献', '矯', '鞠', '砧', '鼓', '粉', '鋼', '誇', '顎', '擬', '犠', '蟻', '祇', '欺', '儀', '義', '妓', '求', '虚', '乾', '喜', '基', '寄', '気', '棋', '稀', '徽', '奇', '軌', '輝', '機', '騎', '技', '宜', '偽', '牛', '具', '愚', '遇', '群', '後', '語', '護', '効', '更', '恒', '洪', '航', '貢', '降', '高', '剛', '豪', '光', '沖', '溝', '鋼', '誇', '幸', '恭', '許', '候', '慌', '坑', '孝', '抗', '皇', '江', '開', '階', '寛', '歓', '汗', '缶', '看', '鉄', '姦', '丸', '岸', '岩', '玩', '翰', '肝', '間', '勘', '寒', '感', '慣', '歓', '棺', '款', '関', '陥', '鬼', '希', '嬉', '吉', '喫', '詰', '却', '拒', '巨', '距', '極', '玉', '勤', '禁', '錦', '仁', '吟', '銀', '琴', '均', '菌', '恨', '倫', '純', '循', '旬', '殉', '淳', '準', '潤', '遵', '儘', '壊', '懐', '拐' 
    ]


// MODEL
var model = null
async function loadMyModel() {
    model = await tf.loadLayersModel('model/model.json');
    loadingScreen.style.visibility = 'hidden';
}


loadMyModel()
// MODEL

const reposition = (e) => {
    coord.x = e.clientX - box.offsetLeft;
    coord.y = e.clientY - box.offsetTop;
}
const start = (e) => {
    box.addEventListener("mousemove", draw);

    step++;
    const newCanvas = document.createElement('canvas');
    newCanvas.classList.add('input-canvas');
    newCanvas.height = 512;
    newCanvas.width = 512;
    box.append(newCanvas);
    canvasList.push(newCanvas);
    contextList.push(newCanvas.getContext("2d"));

    reposition(e);
}

const stop = () => {
    box.removeEventListener("mousemove", draw);
}

const draw = (e) => {
    contextList[step].beginPath();
    // contextList[step].filter = "blur(1px)";
    contextList[step].lineWidth = 16;
    contextList[step].lineCap = "round";
    contextList[step].strokeStyle = "black";
    contextList[step].moveTo(coord.x, coord.y);
    reposition(e);
    contextList[step].lineTo(coord.x, coord.y);
    contextList[step].stroke();
}

const saveImage = async (e) => {
    if (contextList.length <= 0) return;

    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.height = 64;
    virtualCanvas.width = 64;
    const virtualCtx = virtualCanvas.getContext('2d');
    virtualCtx.fillStyle = "black";
    virtualCtx.fillRect(0, 0, virtualCanvas.width, virtualCanvas.height);

    for (let canvas of canvasList) {
        virtualCtx.filter = 'invert(1)'
        virtualCtx.drawImage(canvas, 0, 0, 64, 64);
    }

    // const link = document.createElement('a');
    // link.download = `${crypto.randomUUID()}.png`;
    // link.href = virtualCanvas.toDataURL();
    // link.click();

    let input_image = await tf.browser.fromPixels(virtualCanvas, 1)
        // .mean(2)
        // .toFloat()
        // .expandDims(-1)
        // .resizeBilinear([64, 64])
        .asType('float32')
        // .reshape([64, 64, 1])
        .div(tf.scalar(255))
        .array()

        
        input_image = tf.tensor3d(input_image);

    const canvas = document.createElement('canvas');
    canvas.width = input_image.shape.width
    canvas.height = input_image.shape.height
    await tf.browser.toPixels(input_image, canvas);
    const link = document.createElement('a');
    link.download = `${crypto.randomUUID()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

const clearCanvas = (e) => {
    if (contextList.length <= 0) return;
    contextList.pop();
    canvasList.pop().remove();
    step--;
}

const predict = async (e) => {
    if (contextList.length <= 0) return;
    loadingScreen.style.visibility = 'visible';

    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.height = 64;
    virtualCanvas.width = 64;
    const virtualCtx = virtualCanvas.getContext('2d');
    virtualCtx.fillStyle = "black";
    virtualCtx.fillRect(0, 0, virtualCanvas.width, virtualCanvas.height);

    for (let canvas of canvasList) {
        virtualCtx.filter = 'invert(1)'
        virtualCtx.drawImage(canvas, 0, 0, 64, 64);
    }

    let input_image = await tf.browser.fromPixels(virtualCanvas, 1)
        // .mean(2)
        // .toFloat()
        // .expandDims(0)
        // .expandDims(-1)
        .asType('float32')
        // .resizeBilinear([64, 64])
        .reshape([1, 64, 64, 1])
        .div(255.0)

    // input_image = tf.tensor4d(input_image);

    // PODGLAD OBRAZKA W 64 X 64 ALE MUSI BYC TENSOR 3D
    // const link = document.createElement('a');
    // link.download = `${crypto.randomUUID()}.png`;
    // link.href = virtualCanvas.toDataURL();
    // link.click();


    if (model != null) {
        const result = model.predict(input_image)
        console.log(result.print());

        let [results] = await result.array();
        results = results.map((v, i) => ({
            val: v,
            literal: charactersList[i]
        }))
        results.sort((a, b) => b.val - a.val);

        for (let [i, res] of results.entries()) {
            resultsLi[i].innerText = `${res.literal} - ${res.val.toFixed(2)}`
            if (i === 4) break;
        }
        loadingScreen.style.visibility = 'hidden';
    }
}

box.addEventListener("mousedown", start);
document.addEventListener("mouseup", stop);
document.addEventListener("keydown", (e) => {
    if (!e.ctrlKey) return;
    if (e.key !== 'z') return;

    clearCanvas();
})
