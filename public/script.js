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
const socket = io('/', {
    transports: ['websocket']
});

let isDrawing = false;
let brushWidth = sizeSlider.value;
let selectedtool = "brush";
let prevMouseX, prevMouseY, snapshot;
let selectedColor = "#000";
let selectedFillColor = "#2980d1";
let userId = "";
let shapeData
let isFillEnabled = false;
let username = "Guest";

socket.on("connect", () => {
    userId = socket.id;
    username = `User-${userId.slice(0, 4)}`;
});



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
const checkmark = document.querySelector(".checkmark");
const checkbox = document.querySelector(".checkbox");
const fab_item = document.querySelectorAll(".fab-item");
const chatMessages = document.getElementById("chat-messages");
const addTextBtn = document.querySelector(".add_text");
const clear_all = document.querySelector(".clear_all");
const chatContainer = document.getElementById("chat-input-container");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const openChatBtn = document.querySelector(".open_chat");
const MAX_CHATS = 10;

addTextBtn.addEventListener("click", () => {
    chatContainer.classList.add("show");
    chatInput.focus();
});

if (openChatBtn) {
    openChatBtn.addEventListener("click", () => {
        chatContainer.classList.add("show");
        chatInput.focus();
    });
}

function renderChatMessage(data) {
    const row = document.createElement("div");
    row.className = "chat_msg";

    const name = document.createElement("span");
    name.className = "chat_name";
    name.textContent = data.name;
    name.style.color = data.color || "#333";

    const text = document.createElement("span");
    text.className = "chat_text";
    text.textContent = `: ${data.text}`;

    row.appendChild(name);
    row.appendChild(text);
    chatMessages.appendChild(row);

    while (chatMessages.children.length > MAX_CHATS) {
        chatMessages.removeChild(chatMessages.firstChild);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Optional: send message
sendBtn.addEventListener("click", () => {
    const msg = chatInput.value.trim();
    if (!msg) return;
    const payload = { name: username, text: msg, color: selectedColor };
    socket.emit("msg", payload);
    renderChatMessage(payload);
    chatInput.value = "";
    chatContainer.classList.remove("show");
});

chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});

socket.on("msg", (msg) => {
    renderChatMessage(msg);
})

let currentTarget = null;

// create pickr instance
const pickr = Pickr.create({
    el: "#colorPickerContainer",
    theme: "monolith",
    default: "#000000",
    components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
            hex: true,
            rgba: true,
            input: true,
            // save: true
        }
    }
});



stroke.addEventListener("click", () => {
    currentTarget = "stroke";
    pickr.setColor(selectedColor);
    pickr.show();
})
fill.addEventListener("click", () => {
    currentTarget = "fill";
    pickr.setColor(selectedFillColor);
    pickr.show();
})

// handle color save
pickr.on("change", (color) => {
    const c = color.toHEXA().toString();

    if (currentTarget === "stroke") {
        selectedColor = c;
        stroke.style.backgroundColor = c;
    } else {
        selectedFillColor = c;
        fill.style.backgroundColor = c;
    }
});
document.addEventListener("pointerdown", (e) => {
    // delay so Pickr can process the event first
    requestAnimationFrame(() => {
        const pickerApp = e.target.closest(".pcr-app");
        const isPicker = !!pickerApp;

        if (!isPicker && pickr.isOpen()) {
            pickr.hide();
        }

        if (!chatContainer.contains(e.target) && e.target !== addTextBtn && e.target !== openChatBtn) {
            chatContainer.classList.remove("show");
        }
    });
});



toggle.addEventListener("click", () => {
    fab.classList.toggle("open");
    tool_hub.classList.toggle("show");
    phon_size_slider.classList.toggle("show");
    side_button_container.classList.toggle("active")
    checkbox.classList.toggle("show")
});
stroke.style.backgroundColor = selectedColor
fill.style.backgroundColor = selectedFillColor

fab_item.forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelector(".fab-item.active_item").classList.remove("active_item");
        button.classList.add("active_item");
        selectedtool = button.id;
    });
});
phon_size_slider.addEventListener("change", () => (brushWidth = phon_size_slider.value));

reload_button.addEventListener("click", () => {
    location.reload()
})
clear_all.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear");
})


checkmark.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    isFillEnabled = checkmark.classList.toggle("checked");
    fillColor.checked = isFillEnabled;
});
// fillColor.addEventListener("change", () => {
//     isFillEnabled = fillColor.checked
// })
// safat bug


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
function drawSegment(x1, y1, x2, y2, color, width) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
}
// Event listeners
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", stopDraw);

// Mobile touch events
canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", drawing);
canvas.addEventListener("touchend", stopDraw);



function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const p = getPointerPos(e);
    prevMouseX = p.x;
    prevMouseY = p.y;
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}
let lastEmit = 0;

function drawing(e) {
    if (!isDrawing) return;
    if (e.touches && e.touches.length > 1) return;
    e.preventDefault();
    const now = Date.now();
    if (now - lastEmit < 40) return; // ~60fps
    lastEmit = now;
    const p = getPointerPos(e);

    // draw locally
    if (selectedtool === "brush" || selectedtool === "eraser") {
        let color = selectedtool === "eraser" ? "#fff" : selectedColor
        drawSegment(prevMouseX, prevMouseY, p.x, p.y, color, brushWidth);
        // send to server
        socket.emit("draw", {
            userId,
            type: "brush",
            x1: prevMouseX,
            y1: prevMouseY,
            x2: p.x,
            y2: p.y,
            color: color,
            width: brushWidth
        });

        prevMouseX = p.x;
        prevMouseY = p.y;
    } else {
        ctx.putImageData(snapshot, 0, 0);
        drawShape(selectedtool, prevMouseX, prevMouseY, p.x - prevMouseX, p.y - prevMouseY, selectedColor, isFillEnabled, selectedFillColor, brushWidth);
        shapeData = { userId, type: selectedtool, x: prevMouseX, y: prevMouseY, width: p.x - prevMouseX, height: p.y - prevMouseY, color: selectedColor, fill: isFillEnabled, fill_color: selectedFillColor, lineWidth: brushWidth }
    }

}
function stopDraw(e) {
    e.preventDefault();
    if (selectedtool !== "brush" && selectedtool !== "eraser") {
        socket.emit("draw", shapeData)
    }
    isDrawing = false;
}


socket.on("draw", (data) => {
    if (data.type === "brush") {
        drawSegment(
            data.x1,
            data.y1,
            data.x2,
            data.y2,
            data.color,
            data.width
        );

    } else {
        drawShape(data.type, data.x, data.y, data.width, data.height, data.color, data.fill, data.fill_color, data.lineWidth);
    }

});

socket.on("clear", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
socket.emit("requestCanvas");

socket.on("recieveCanvas", (history) => {
    history.forEach(data => {
        if (data.type === "brush") {
            drawSegment(
                data.x1,
                data.y1,
                data.x2,
                data.y2,
                data.color,
                data.width
            );

        } else {
            drawShape(data.type, data.x, data.y, data.width, data.height, data.color, data.fill, data.fill_color, data.lineWidth);
        }
    })
});
