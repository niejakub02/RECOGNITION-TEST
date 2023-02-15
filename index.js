const box = document.querySelector('.input-box');
const loadingScreen = document.querySelector('.loading-screen');
const coord = { x: 0, y: 0 };
const canvasList = [];
const contextList = [];
let step = -1;
const resultsLi = document.querySelectorAll('.results-box > span');
const charactersList = ['話', '夕', '悪', '明', '目', '無', '理', '道', '西', '京'];

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
    contextList[step].lineWidth = 20;
    contextList[step].lineCap = "round";
    contextList[step].strokeStyle = "black";
    contextList[step].moveTo(coord.x, coord.y);
    reposition(e);
    contextList[step].lineTo(coord.x, coord.y);
    contextList[step].stroke();
}

const saveImage = (e) => {
    if (contextList.length <= 0 ) return;

    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.height = 512;
    virtualCanvas.width = 512;
    const virtualCtx = virtualCanvas.getContext('2d');

    for (let canvas of canvasList) {
        virtualCtx.drawImage(canvas, 0, 0, 512, 512);
    }

    const link = document.createElement('a');
    link.download = `${crypto.randomUUID()}.png`;
    link.href = virtualCanvas.toDataURL();
    link.click();
}

const clearCanvas = (e) => {
    if (contextList.length <= 0 ) return;
    contextList.pop();
    canvasList.pop().remove();
    step--;
}

const predict = async (e) => {
    if (contextList.length <= 0) return;
    loadingScreen.style.visibility = 'visible';

    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.height = 512;
    virtualCanvas.width = 512;
    const virtualCtx = virtualCanvas.getContext('2d');

    for (let canvas of canvasList) {
        virtualCtx.drawImage(canvas, 0, 0, 512, 512);
    }

    let image = virtualCtx.getImageData(0, 0, virtualCanvas.height, virtualCanvas.width);
    let n = []
    for (let i=3; i<image.data.length; i+=4) {
        n.push(image.data[i])
    }

    // let input_image = tf.browser.fromPixels(image, 1)
    let input_image = tf.tensor1d(n);
    input_image = input_image.asType('float32')
    input_image = input_image.div(255.0)
    input_image = input_image.reshape([1, 512, 512])
    
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
