const board = document.querySelector('.drawing_board');
const canvas = document.querySelector(".drawing_board canvas");
const ctx = canvas.getContext("2d");
const toolBtns = document.querySelectorAll(".tools");
const fillColor = document.querySelector("#fill_color");
const sizeSlider = document.querySelector("#size_slider");
const opacitySlider = document.querySelector("#opacity_slider");
const shadeSlider = document.querySelector("#shade_slider");
const colorsbutton = document.querySelectorAll(".colors .option");
const colorPicker = document.querySelector("#colorPicker");
const clearCanvas = document.querySelector(".clear_canvas");
const undo_redo_container = document.querySelector(".undo_redo_container");
const undoBtns = document.querySelectorAll(".undo_btn");
const redoBtns = document.querySelectorAll(".redo_btn");
const saveImg = document.querySelector(".save_image");
const fillColorPicker = document.querySelector("#fill_color_picker");

// Login elements
const loginScreen = document.getElementById("login-screen");
const loginForm = document.getElementById("login-form");
const nameInput = document.getElementById("name-input");
const roomInput = document.getElementById("room-input");
const drawingContainer = document.querySelector(".drawing_container");

let socket = null;

let isDrawing = false;
let brushWidth = sizeSlider.value;
let selectedtool = "brush";
let prevMouseX, prevMouseY, snapshot;
let selectedColor = "#000";
let selectedFillColor = "#2980d1";
let userId = "";
let shapeData
let isFillEnabled = false;
let currentUser = { name: "", room: "Lolipop" };
let currentStrokeId = null;
let brushOpacity = opacitySlider ? Number(opacitySlider.value) / 100 : 1;
let shadeStrength = shadeSlider ? Number(shadeSlider.value) / 100 : 0.25;



// phone
const download_button = document.querySelector(".download_button"); //phone
const import_buttons = document.querySelectorAll(".import_button");
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
const toast = document.getElementById("chat-toast");
const addTextBtn = document.querySelector(".add_text");
const clear_all = document.querySelector(".clear_all");
const chatContainer = document.getElementById("chat-input-container");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatMessages = document.getElementById("chat-messages");
const chatPanel = document.getElementById("chat-panel");
const eyedropper = document.querySelector(".eyedropper")

const cursorIcons = ["./icons/soward.png", "./icons/hammer.png"];
const cursorIcon = cursorIcons[Math.floor(Math.random() * cursorIcons.length)];

eyedropper.addEventListener("click", () => {
    selectTool("eyedropper")
})


let toastTimer;
const remoteCursors = {}; // userId -> { el, hideTimer }

addTextBtn.addEventListener("click", () => {
    chatContainer.classList.add("show");
    chatInput.focus(); // bring up the phone keyboard
});

// Optional: send message
sendBtn.addEventListener("click", () => {
    const msg = chatInput.value.trim();
    if (!msg || !socket) return;
    socket.emit("msg", msg)
    chatInput.value = "";
    chatContainer.classList.remove("show");
});

chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});

function showChatMessage(text, duration = 3000) {
    clearTimeout(toastTimer);
    toast.querySelector(".msg").textContent = text;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}

// Append message to persistent chat panel
function appendChatMessage(name, text, color) {
    if (!chatMessages) return;

    const item = document.createElement("div");
    item.className = "chat-message";

    const nameEl = document.createElement("span");
    nameEl.className = "chat-name";
    if (color) nameEl.style.color = color;
    nameEl.textContent = `${name}:`;

    const textEl = document.createElement("span");
    textEl.className = "chat-text";
    textEl.textContent = ` ${text}`;

    item.appendChild(nameEl);
    item.appendChild(textEl);
    chatMessages.appendChild(item);

    // auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getOrCreateRemoteCursor(userId, userName, userColor) {
    if (remoteCursors[userId]) return remoteCursors[userId];

    const wrapper = document.createElement("div");
    wrapper.className = "remote-cursor";

    const icon = document.createElement("div");
    icon.className = "remote-cursor-icon";
    icon.setAttribute("style", `background-image:url("${cursorIcon}")`)


    const label = document.createElement("div");
    label.className = "remote-cursor-label";
    label.textContent = userName || "User";
    if (userColor) {
        label.style.backgroundColor = userColor;
    }

    wrapper.appendChild(icon);
    wrapper.appendChild(label);

    board.appendChild(wrapper);

    remoteCursors[userId] = {
        el: wrapper,
        hideTimer: null
    };

    return remoteCursors[userId];
}

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

        if (!chatContainer.contains(e.target) && e.target !== addTextBtn) {
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
    undo_redo_container.classList.toggle("show")

    // On phone, show/hide the chat panel when FAB opens/closes
    if (window.innerWidth <= 768 && chatPanel) {
        if (fab.classList.contains("open")) {
            chatPanel.classList.add("show");
        } else {
            chatPanel.classList.remove("show");
        }
    }
});
stroke.style.backgroundColor = selectedColor
fill.style.backgroundColor = selectedFillColor

fab_item.forEach((button) => {
    button.addEventListener("click", () => {
        selectTool(button.id);
    });
});
phon_size_slider.addEventListener("change", () => (brushWidth = phon_size_slider.value));
if (opacitySlider) opacitySlider.addEventListener("change", () => (brushOpacity = Number(opacitySlider.value) / 100));



clear_all.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) {
        socket.emit("clear");
    }
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
    canvas.height = 1500;
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

// Keyboard pan/zoom for desktop
document.addEventListener("keydown", (e) => {
    // Avoid interfering while typing in inputs or textareas
    const target = e.target;
    const isTypingElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

    if (isTypingElement) return;
    if (e.ctrlKey || e.metaKey) return;

    const moveStep = 40;
    const zoomStep = 0.1;

    switch (e.key) {
        case "ArrowUp":
            y += moveStep;
            applyTransform();
            e.preventDefault();
            break;
        case "ArrowDown":
            y -= moveStep;
            applyTransform();
            e.preventDefault();
            break;
        case "ArrowLeft":
            x += moveStep;
            applyTransform();
            e.preventDefault();
            break;
        case "ArrowRight":
            x -= moveStep;
            applyTransform();
            e.preventDefault();
            break;
        case "+":
        case "=": // plus without shift
            scale = Math.min(5, scale + zoomStep);
            applyTransform();
            e.preventDefault();
            break;
        case "-":
        case "_":
            scale = Math.max(0.5, scale - zoomStep);
            applyTransform();
            e.preventDefault();
            break;
        default:
            break;
    }
});


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

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function rgbToHex(r, g, b) {
    const toHex = (v) => v.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function pickColorAtEvent(e) {
    const p = getPointerPos(e);
    const px = Math.floor(clamp(p.x, 0, canvas.width - 1));
    const py = Math.floor(clamp(p.y, 0, canvas.height - 1));
    const data = ctx.getImageData(px, py, 1, 1).data;
    const hex = rgbToHex(data[0], data[1], data[2]);
    selectedColor = hex;

    if (colorPicker) colorPicker.value = hex;
    if (stroke) stroke.style.backgroundColor = hex;

    // keep Pickr in sync if it exists
    try {
        if (typeof pickr !== "undefined" && pickr) pickr.setColor(hex);
    } catch { }

    showChatMessage(`🎯 Picked ${hex}`, 1500);
    return hex;
}

function setDesktopActiveTool(toolId) {
    const allTools = document.querySelectorAll(".tools_board .option.tools");
    allTools.forEach((el) => el.classList.remove("active"));
    const next = document.querySelector(`.tools_board .option.tools#${CSS.escape(toolId)}`);
    if (next) next.classList.add("active");
}

function setMobileActiveTool(toolId) {
    const items = document.querySelectorAll(".fab-item");
    items.forEach((el) => el.classList.remove("active_item"));
    const next = document.querySelector(`.fab-item#${CSS.escape(toolId)}`);
    if (next) next.classList.add("active_item");
}

function selectTool(toolId) {
    selectedtool = toolId;
    setDesktopActiveTool(toolId);
    setMobileActiveTool(toolId);
}

function getBrushStyleForTool(tool) {
    if (tool === "pencil") {
        return {
            tool: "pencil",
            color: selectedColor,
            alpha: clamp(brushOpacity, 0.05, 1),
            composite: "source-over"
        };
    }

    if (tool === "eraser") {
        return {
            tool: "eraser",
            color: "#ffffff",
            alpha: 1,
            composite: "source-over"
        };
    }

    return {
        tool: "brush",
        color: selectedColor,
        alpha: clamp(brushOpacity, 0.05, 1),
        composite: "source-over"
    };
}

toolBtns.forEach((button) => {
    button.addEventListener("click", () => {
        selectTool(button.id);
    });
});

colorsbutton.forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelector(".drawing_container .colors .selected").classList.remove("selected");
        button.classList.add("selected");
        const bg = window.getComputedStyle(button).getPropertyValue("background-color");
        selectedColor = cssColorToHex(bg) || bg;
        if (colorPicker && selectedColor.startsWith("#")) colorPicker.value = selectedColor;
        if (stroke) stroke.style.backgroundColor = selectedColor;
        try {
            if (typeof pickr !== "undefined" && pickr && selectedColor.startsWith("#")) pickr.setColor(selectedColor);
        } catch { }
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
    if (socket) {
        socket.emit("clear");
    }
});

function requestUndo() {
    if (!socket) return;
    socket.emit("undo");
}

function requestRedo() {
    if (!socket) return;
    socket.emit("redo");
}

undoBtns.forEach((btn) => btn.addEventListener("click", requestUndo));
redoBtns.forEach((btn) => btn.addEventListener("click", requestRedo));

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
    const target = e.target;
    const isTypingElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

    if (isTypingElement) return;

    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && key === "z") {
        if (e.shiftKey) {
            requestRedo();
        } else {
            requestUndo();
        }
        e.preventDefault();
        return;
    }

    if ((e.ctrlKey || e.metaKey) && key === "y") {
        requestRedo();
        e.preventDefault();
    }
});

sizeSlider.addEventListener("change", () => (brushWidth = sizeSlider.value));


saveImg.addEventListener("click", save_canva);
download_button.addEventListener("click", save_canva);

if (import_buttons && import_buttons.length > 0) {
    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = "image/*";
    importInput.style.display = "none";
    document.body.appendChild(importInput);

    import_buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            importInput.value = "";
            importInput.click();
        });
    });

    importInput.addEventListener("change", () => {
        const file = importInput.files && importInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const drawWidth = img.width * scale;
                const drawHeight = img.height * scale;
                const drawX = (canvas.width - drawWidth) / 2;
                const drawY = (canvas.height - drawHeight) / 2;

                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                // ✅ Emit the image to the server so others receive it
                socket.emit("importImage", {
                    dataUrl: e.target.result,
                    x: drawX,
                    y: drawY,
                    width: drawWidth,
                    height: drawHeight,
                    canvasWidth: canvas.width,
                    canvasHeight: canvas.height
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

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

function drawSegmentStyled(x1, y1, x2, y2, color, width, alpha = 1, composite = "source-over") {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = composite;
    drawSegment(x1, y1, x2, y2, color, width);
    ctx.restore();
}

function renderDrawEvent(data) {
    if (!data) return;

    if (data.type === "brush") {
        const alpha = typeof data.alpha === "number" ? data.alpha : 1;
        const composite = data.composite || "source-over";
        drawSegmentStyled(data.x1, data.y1, data.x2, data.y2, data.color, data.width, alpha, composite);
        return;
    }
    if (data.type === "importImage") {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, data.x, data.y, data.width, data.height);
        };
        img.src = data.dataUrl;
        return;

    }

    drawShape(data.type, data.x, data.y, data.width, data.height, data.color, data.fill, data.fill_color, data.lineWidth);
}

function updateRemoteCursorPosition(data) {
    const id = data.userId;
    if (!id) return;

    const cx = typeof data.x2 === "number" ? data.x2 : data.x || 0;
    const cy = typeof data.y2 === "number" ? data.y2 : data.y || 0;

    const px = x + cx * scale;
    const py = y + cy * scale;

    const cursor = getOrCreateRemoteCursor(id, data.userName, data.userColor);
    cursor.el.style.display = "flex";
    cursor.el.style.transform = `translate(${px}px, ${py}px)`;

    if (cursor.hideTimer) clearTimeout(cursor.hideTimer);
    cursor.hideTimer = setTimeout(() => {
        cursor.el.style.display = "none";
    }, 250);
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

    if (selectedtool === "eyedropper") {
        pickColorAtEvent(e);
        selectTool("brush");
        return;
    }

    isDrawing = true;
    const p = getPointerPos(e);
    prevMouseX = p.x;
    prevMouseY = p.y;
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (selectedtool === "brush" || selectedtool === "pencil" || selectedtool === "eraser") {
        currentStrokeId = `${userId || "local"}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    } else {
        currentStrokeId = `${userId || "local"}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}
let lastEmit = 0;

let pencilLastTime = 0;

function drawPencilSegment(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const timeDelta = (Date.now() - pencilLastTime) || 16;
    const speed = dist / timeDelta;
    pencilLastTime = Date.now();
    // Slow strokes = dark/thick (pressure 1), fast strokes = light/thin (pressure ~0.15)
    const pressure = clamp(1 - speed * 0.6, 0.15, 1);
    const alpha = clamp(pressure * 0.78, 0.15, 0.85);
    const lineW = clamp(brushWidth * (0.4 + pressure * 0.6), 0.5, brushWidth);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Main stroke
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Pencil grain: scatter tiny dots along the stroke
    const steps = Math.max(1, Math.floor(dist / 3));
    ctx.fillStyle = selectedColor;
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t + (Math.random() - 0.5) * lineW * 0.9;
        const py = y1 + dy * t + (Math.random() - 0.5) * lineW * 0.9;
        ctx.globalAlpha = alpha * (0.15 + Math.random() * 0.35);
        ctx.beginPath();
        ctx.arc(px, py, Math.random() * (lineW * 0.22) + 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawing(e) {
    if (!isDrawing) return;
    if (e.touches && e.touches.length > 1) return;
    e.preventDefault();
    const now = Date.now();
    if (now - lastEmit < 40) return; // ~60fps
    lastEmit = now;
    const p = getPointerPos(e);

    // draw locally
    if (selectedtool === "brush" || selectedtool === "pencil" || selectedtool === "eraser") {
        if (selectedtool === "pencil") {
            drawPencilSegment(prevMouseX, prevMouseY, p.x, p.y);
            if (socket) {
                const dx = p.x - prevMouseX, dy = p.y - prevMouseY;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const timeDelta = (now - pencilLastTime) || 16;
                const speed = dist / timeDelta;
                const pressure = clamp(1 - speed * 0.6, 0.15, 1);
                socket.emit("draw", {
                    userId,
                    strokeId: currentStrokeId,
                    tool: "pencil",
                    type: "brush",
                    x1: prevMouseX,
                    y1: prevMouseY,
                    x2: p.x,
                    y2: p.y,
                    color: selectedColor,
                    width: clamp(brushWidth * (0.4 + pressure * 0.6), 0.5, brushWidth),
                    alpha: clamp(pressure * 0.78, 0.15, 0.85),
                    composite: "source-over"
                });
            }
        } else {
            const style = getBrushStyleForTool(selectedtool);
            drawSegmentStyled(prevMouseX, prevMouseY, p.x, p.y, style.color, brushWidth, style.alpha, style.composite);

            if (socket) {
                socket.emit("draw", {
                    userId,
                    strokeId: currentStrokeId,
                    tool: style.tool,
                    type: "brush",
                    x1: prevMouseX,
                    y1: prevMouseY,
                    x2: p.x,
                    y2: p.y,
                    color: style.color,
                    width: brushWidth,
                    alpha: style.alpha,
                    composite: style.composite
                });
            }
        }

        prevMouseX = p.x;
        prevMouseY = p.y;
    } else {
        ctx.putImageData(snapshot, 0, 0);
        drawShape(selectedtool, prevMouseX, prevMouseY, p.x - prevMouseX, p.y - prevMouseY, selectedColor, isFillEnabled, selectedFillColor, brushWidth);
        shapeData = { userId, strokeId: currentStrokeId, type: selectedtool, x: prevMouseX, y: prevMouseY, width: p.x - prevMouseX, height: p.y - prevMouseY, color: selectedColor, fill: isFillEnabled, fill_color: selectedFillColor, lineWidth: brushWidth }
    }

}
function stopDraw(e) {
    e.preventDefault();
    const isBrushLike = selectedtool === "brush" || selectedtool === "pencil" || selectedtool === "eraser";
    if (!isBrushLike && socket && shapeData) {
        socket.emit("draw", shapeData);
        shapeData = null;
    }
    isDrawing = false;
    currentStrokeId = null;
}

function setupSocketHandlers() {
    if (!socket) return;

    socket.on("connect", () => {
        userId = socket.id;
        showChatMessage(`✨ ${currentUser.name || "Someone"} joined room "${currentUser.room}"`);
        socket.emit("requestCanvas");
    });

    socket.on("draw", (data) => {
        renderDrawEvent(data);

        // show a temporary "magical cursor" for the remote user
        updateRemoteCursorPosition(data);
    });

    socket.on("clear", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on("recieveCanvas", (history) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        history.forEach(renderDrawEvent);
    });

    socket.on("resetCanvas", (history) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        history.forEach(renderDrawEvent);

        // hide remote cursors after a reset
        Object.values(remoteCursors).forEach((c) => {
            if (c?.el) c.el.style.display = "none";
        });
    });

    socket.on("msg", (msg) => {
        // msg is an object: { name, text, color }
        const { name, text, color } = msg || {};
        if (!text) return;
        appendChatMessage(name || "User", text, color);

        // Also show a temporary popup toast for the latest message
        const displayName = name || "User";
        showChatMessage(`${displayName}: ${text}`);
    });

    socket.on("importImage", (data) => {
        console.log("importImage")
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, data.x, data.y, data.width, data.height);
        };
        img.src = data.dataUrl;
    });
}

function initSocket(name, room) {
    currentUser = {
        name: name || "Guest",
        room: room || "Lolipop"
    };

    socket = io('/', {
        transports: ['websocket'],
        query: {
            name: currentUser.name,
            room: currentUser.room
        }
    });

    setupSocketHandlers();
}

// Login form submit -> connect socket & show canvas
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = nameInput.value.trim() || "Guest";
        const room = (roomInput.value.trim() || "Lolipop");

        initSocket(name, room);

        // Fully hide and remove the login screen after successful login
        if (loginScreen) {
            loginScreen.parentNode.removeChild(loginScreen);
        }
        if (drawingContainer) {
            drawingContainer.classList.add("active");
        }
    });
}
