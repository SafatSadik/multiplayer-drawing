const board = document.querySelector('.drawing_board');
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
let selectedFillColor = "#ffffff";
let userId = Math.random().toString(36).substring(7);
let shapeData 



// phone
const download_button = document.querySelector(".download_button"); //phone
const reload_button = document.querySelector(".reload_button");
const fab = document.querySelector(".fab");
const toggle = document.querySelector(".fab-toggle");
const tool_hub = document.querySelector(".tool_hub");
const stroke = document.querySelector(".stroke");
const fill = document.querySelector(".fill");
const phon_size_slider = document.querySelector(".phon_size_slider");
const phone_fill_input = document.querySelector(".phone_fill_input");
const phone_stroke_input = document.querySelector(".phone_stroke_input");
const side_button_container = document.querySelector(".side_button_container");
const fab_item = document.querySelectorAll(".fab-item");



let fill_allow = window.innerWidth>768 ? fillColor.checked : true


toggle.addEventListener("click", () => {
    fab.classList.toggle("open");
    tool_hub.classList.toggle("show");
    phon_size_slider.classList.toggle("show");
    side_button_container.classList.toggle("active")
});
stroke.style.backgroundColor = selectedColor
fill.style.backgroundColor = selectedFillColor


phone_fill_input.addEventListener("change", () => {
    selectedFillColor = phone_fill_input.value;
    fill.style.backgroundColor = selectedFillColor
});
phone_stroke_input.addEventListener("change", () => {
    selectedColor = phone_stroke_input.value;
    stroke.style.backgroundColor = selectedColor
});
stroke.addEventListener("click", () => {
    phone_stroke_input.click()
})
fill.addEventListener("click", () => {
    phone_fill_input.click()
})

fab_item.forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelector(".fab-item.active_item").classList.remove("active_item");
        button.classList.add("active_item");
        selectedtool = button.id;
    });
});



phon_size_slider.addEventListener("change", () => (brushWidth = phon_size_slider.value));

reload_button.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear");
    location.reload()
})

// --------------------------------------- phone finish




window.addEventListener("load", function () {
    canvas.width = 1000;
    canvas.height = 1000;
});




//hammer code start


let x = 0;
let y = 0;
let scale = 1;

let lastX = 0;
let lastY = 0;
let lastScale = 1;

// Hammer setup
const hammer = new Hammer.Manager(board);

hammer.add(new Hammer.Pan({
    pointers: 2,
    direction: Hammer.DIRECTION_ALL,
    threshold: 0
}));

hammer.add(new Hammer.Pinch({
    enable: true
}));

// Allow pan + pinch together
hammer.get('pinch').recognizeWith('pan');

function applyTransform() {
    canvas.style.transform =
        `translate(${x}px, ${y}px) scale(${scale})`;
}

/* ---------------- PAN ---------------- */
hammer.on('panstart', () => {
    lastX = x;
    lastY = y;
});

hammer.on('panmove', (e) => {
    x = lastX + e.deltaX;
    y = lastY + e.deltaY;
    applyTransform();
});

/* ---------------- PINCH ---------------- */
hammer.on('pinchstart', () => {
    lastScale = scale;
});

hammer.on('pinchmove', (e) => {
    scale = Math.min(Math.max(0.5, lastScale * e.scale), 5);
    applyTransform();
});



//     hammer code endd


// Get coordinates
function getPointerPos(e) {
    const rect = board.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
        x: (clientX - rect.left - x) / scale,
        y: (clientY - rect.top - y) / scale
    };
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
fillColorPicker.addEventListener("change", () => {
    selectedFillColor = fillColorPicker.value;
});

clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear");
});

sizeSlider.addEventListener("change", () => (brushWidth = sizeSlider.value));


saveImg.addEventListener("click", save_canva);
download_button.addEventListener("click", save_canva);

function save_canva() {
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function drawShape(type, x, y, width, height, color, fill, fill_color, lineWidth) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = fill ? fill_color : "transparent";
    ctx.lineWidth = lineWidth;
    if (type === "rectangle") {
        // ctx.fillRect(x, y, width, height)
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

function drawBrush(data) {
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.width;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
}

// Drawing while moving
function drawing(e) {
    if (!isDrawing) return;
    if (e.touches && e.touches.length > 1) return;
    e.preventDefault();
    ctx.putImageData(snapshot, 0, 0);   // restore raw pixels

    // Get pointer and adjust for pan/zoom
    let p = getPointerPos(e);

    if (selectedtool === "brush" || selectedtool === "eraser") {
        ctx.strokeStyle = selectedtool === "eraser" ? "#fff" : selectedColor;
        ctx.lineWidth = brushWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        socket.emit("draw", { userId, type: "brush", x: p.x, y: p.y, color: ctx.strokeStyle, width: ctx.lineWidth });
    } else {
        drawShape(selectedtool, prevMouseX, prevMouseY, p.x - prevMouseX, p.y - prevMouseY, selectedColor, fill_allow, selectedFillColor, brushWidth);
        shapeData = { userId, type: selectedtool, x: prevMouseX, y: prevMouseY, width: p.x - prevMouseX, height: p.y - prevMouseY, color: selectedColor, fill: fill_allow, fill_color: selectedFillColor, lineWidth: brushWidth }
    }
}

// Start drawing
function startDraw(e) {
    e.preventDefault(); // prevent scrolling on touch
    isDrawing = true;

    let p = getPointerPos(e);
    prevMouseX = p.x;
    prevMouseY = p.y;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y)

    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedColor;

    socket.emit("start", { x: p.x, y: p.y, color: selectedColor, width: brushWidth });
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Stop drawing
function stopDraw(e) {
    e.preventDefault();
    if (selectedtool !== "brush" && selectedtool !== "eraser") {
        socket.emit("draw", shapeData)
    }
    isDrawing = false;
}

// Event listeners
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", stopDraw);

// Mobile touch events
canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", drawing);
canvas.addEventListener("touchend", stopDraw);




socket.on("start", ({ x, y, color, width }) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
});

socket.on("draw", (data) => {
    if (data.type === "brush") {
        drawBrush(data)
    } else {
        drawShape(data.type, data.x, data.y, data.width, data.height, data.color, data.fill, data.fill_color, data.lineWidth);
    }
});


socket.on("clear", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// socket.on("userJoined", (username) => {
//     alert(`${username} joined!`);
// });

// socket.on("user-left", (username) => {
//     alert(`${username} left!`);
// });
// safat later