const canvas = document.querySelector(".drawing_board canvas");
const ctx = canvas.getContext("2d");
const toolBtns = document.querySelectorAll(".tools");
const fillColor = document.querySelector("#fill_color");
const sizeSlider = document.querySelector("#size_slider");
const colorsbutton = document.querySelectorAll(".colors .option");
const colorPicker = document.querySelector("#colorPicker");
const clearCanvas = document.querySelector(".clear_canvas");
const saveImg = document.querySelector(".save_image");
const fillColorPicker = document.querySelector("#fill_color_picker");
const socket = io('/');

let isDrawing = false;
let brushWidth = sizeSlider.value;
let selectedtool = "brush";
let prevMouseX, prevMouseY, snapshot;
let selectedColor = "#000";
let selectedFillColor = "#000";
let userId = Math.random().toString(36).substring(7);
let shapeData


window.addEventListener("load", function() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});

function getMousePos(e) {
    return {
        x: (e.clientX  || e.touches[0].clientX) - canvas.offsetLeft,
        y: (e.clientY  || e.touches[0].clientY) - canvas.offsetTop
    };
}

function drawShape(type, x, y, width, height, color, fill,fill_color, lineWidth) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = fill ? fill_color : "transparent";
    ctx.lineWidth = lineWidth;
    if (type === "rectangle") {
        // ctx.fillRect(x, y, width, height)
        console.log(ctx.fillStyle)
        fill ? ctx.fillRect(x, y, width, height) : ctx.strokeRect(x, y, width, height);
    } else if (type === "circle") {
        let radius = Math.sqrt(width * width + height * height);
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        fill ? ctx.fill() : ctx.stroke();
    } else if (type === "line") {
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
    } else if (type === "triangle") {
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x - width, y + height);
        ctx.closePath();
        fill ? ctx.fill() : ctx.stroke();
    }

}

function drawBrush(data){
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.width;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
}

function drawing(e) {
    if (!isDrawing) return;
    ctx.putImageData(snapshot, 0, 0);
    let { x, y } = getMousePos(e);
    
    if (selectedtool === "brush" || selectedtool === "eraser") {
        ctx.strokeStyle = selectedtool === "eraser" ? "#fff" : selectedColor;
        ctx.lineWidth = brushWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineTo(x, y);
        ctx.stroke();
        socket.emit("draw", { userId, type: "brush", x, y, color: ctx.strokeStyle, width: ctx.lineWidth });
    } else {
        drawShape(selectedtool, prevMouseX, prevMouseY, x - prevMouseX, y - prevMouseY, selectedColor, fillColor.checked,fillColorPicker.value, brushWidth);
        shapeData = { userId, type: selectedtool, x: prevMouseX, y: prevMouseY, width: x - prevMouseX, height: y - prevMouseY, color: selectedColor, fill: fillColor.checked,fill_color : fillColorPicker.value, lineWidth: brushWidth }
        console.log(shapeData)
    }
}

toolBtns.forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelector(".drawing_container .options .active").classList.remove("active");
        button.classList.add("active");
        selectedtool = button.id;
    });
});

colorsbutton.forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelector(".drawing_container .colors .selected").classList.remove("selected");
        button.classList.add("selected");
        selectedColor = window.getComputedStyle(button).getPropertyValue("background-color");
        colorPicker.value = selectedColor;
    });
});

colorPicker.addEventListener("change", () => {
    selectedColor = colorPicker.value;
});

clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear");
});

saveImg.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

sizeSlider.addEventListener("change", () => (brushWidth = sizeSlider.value));

canvas.addEventListener("mousedown", (e) => {
    console.log("mousedown")
    isDrawing = true;
    let { x, y } = getMousePos(e);
    prevMouseX = x;
    prevMouseY = y;
    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedColor;
    socket.emit("start", { x, y, color: selectedColor, width: brushWidth });
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener("mouseup", () => {
    if(selectedtool !== "brush" && selectedtool !== "eraser"){
        socket.emit("draw", shapeData)
    }
    isDrawing = false
});
canvas.addEventListener("mousemove", drawing);

socket.on("start", ({ x, y, color, width }) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
});

socket.on("draw", (data) => {
    console.log(data)
    if(data.type === "brush"){
        drawBrush(data)
    }else{
        drawShape(data.type, data.x, data.y, data.width, data.height, data.color, data.fill,data.fillColor, data.lineWidth);
    }
});


socket.on("clear", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on("user-joined", (username) => {
    alert(`${username} joined!`);
});

socket.on("user-left", (username) => {
    alert(`${username} left!`);
});
