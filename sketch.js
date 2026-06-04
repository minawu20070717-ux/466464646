let video;
let handPose;
let hands = [];

// 系統狀態：LOADING (初始化), PLAYING (進行中)
let systemState = "LOADING"; 
let bootProgress = 0; 
let isModelReady = false; // 新增：用來明確標記 AI 模型是否載入成功

// 遊戲邏輯與計分
let score = 0;
let itemX, itemY;
let itemSpeed = 4;
let itemType = ""; 
let itemName = "";

let bucketX;
let bucketTargetX;
let bucketY;
const BUCKET_WIDTH = 150;
const BUCKET_HEIGHT = 50;

// 未來風科技電子廢棄物資料庫
const recyclableItems = ["⚡ 鋰電池核心", "💾 古董量子磁碟", "🔌 奈米導體線材", "📱 報廢微處理器"];
const trashItems = ["☢️ 變異輻射廢料", "⚠️ 汙損工業機油", "📦 裂解高分子塑料", "🧪 劇毒實驗殘渣"];

let currentGesture = "核心防禦系統啟動中...";

function preload() {
    // 【修正點】在初始化時傳入回呼函式 modelReady，確保系統知道 AI 什麼時候載入完畢
    handPose = ml5.handPose(modelReady);
}

// 新增：模型載入成功的回呼功能
function modelReady() {
    console.log("AI 模型加載成功！");
    isModelReady = true;
}

function setup() {
    // 建立畫布並綁定
    let canvas = createCanvas(640, 480);
    canvas.parent('game-container');
    rectMode(CENTER);

    // 開啟攝影機
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    // 啟動 AI 手勢追蹤
    handPose.detectStart(video, gotHands);

    // 初始化物件數據
    resetItem();
    bucketX = width / 2;
    bucketY = height - 70;
    bucketTargetX = width / 2;
}

function gotHands(results) {
    hands = results;
}

function draw() {
    // 攝影機水平鏡像翻轉
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();

    // 賽博朋克極深藍黑科技濾鏡
    background(10, 10, 20, 210);

    // 根據系統狀態渲染畫面
    if (systemState === "LOADING") {
        drawLoadingScreen();
    } else if (systemState === "PLAYING") {
        drawGameCore();
    }
}

// 🤖 預備開始畫面（修復進度條流暢度與解鎖機制）
function drawLoadingScreen() {
    // 進度條流暢上升邏輯
    if (bootProgress < 75) {
        bootProgress += 1.5; // 前期跑比較快
    } else if (bootProgress >= 75 && bootProgress < 99 && isModelReady) {
        bootProgress += 2.5; // 模型好了之後，迅速衝到接近滿值
    } else if (isModelReady && bootProgress >= 99) {
        bootProgress = 100;  // 完美解鎖
    }

    // 【修正機制】當進度條 100% 且偵測到手或模型完全就緒，即刻切入遊戲，不再卡死
    if (bootProgress >= 100) {
        systemState = "PLAYING";
        return;
    }

    // 畫出科技感外框
    stroke(0, 242, 254, 80);
    strokeWeight(1);
    noFill();
    rect(width / 2, height / 2, 400, 200, 8);
    
    // 角邊科技線條
    stroke(0, 242, 254, 200);
    line(width/2 - 200, height/2 - 100, width/2 - 200, height/2 - 80);
    line(width/2 - 200, height/2 - 100, width/2 - 180, height/2 - 100);
    line(width/2 + 200, height/2 + 100, width/2 + 200, height/2 + 80);
    line(width/2 + 200, height/2 + 100, width/2 + 180, height/2 + 100);

    // 載入中文字
    noStroke();
    fill(0, 242, 254);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("// 系統初始化中 //", width / 2, height / 2 - 40);
    
    textSize(14);
    fill(255, 200);
    let displayPercent = floor(bootProgress);
    text("AI 影像辨識矩陣讀取中... " + displayPercent + "%", width / 2, height / 2);

    // 科技感外流光進度條
    noFill();
    stroke(0, 242, 254, 50);
    rect(width / 2, height / 2 + 40, 250, 12, 6);
    
    fill(0, 242, 254, 200);
    noStroke();
    let currentBarWidth = map(displayPercent, 0, 100, 0, 246);
    
    rectMode(LEFT); 
    rect(width / 2 - 123, height / 2 + 40, currentBarWidth, 8, 4);
    rectMode(CENTER); 

    // 最下方動態提示
    fill(255, 120);
    textSize(12);
    if (isModelReady) {
        fill(0, 255, 153);
        text(">> 雲端神經網路連線成功，即將解鎖系統 <<", width / 2, height / 2 + 75);
    } else {
        text("正在安全連線至 ml5.js 伺服器並下載模型檔案...", width / 2, height / 2 + 75);
    }
}

// 🎮 遊戲核心畫面
function drawGameCore() {
    drawTechHUD();
    processHandTracking();
    manageFallingObjects();
    updateTechBucket();
    drawUI();
}

function drawTechHUD() {
    strokeWeight(1);
    
    fill(0, 255, 153, 12);
    stroke(0, 255, 153, 60);
    rect(width * 0.25, height / 2, width / 2 - 15, height - 30, 8);
    
    fill(255, 0, 127, 12);
    stroke(255, 0, 127, 60);
    rect(width * 0.75, height / 2, width / 2 - 15, height - 30, 8);

    noStroke();
    textSize(13);
    fill(0, 255, 153);
    textAlign(LEFT, TOP);
    text(">> 【核心回收矩陣】\n🖐️ 請張開手掌\n(適用: 電池 / 晶片 / 線材)", 25, 30);

    fill(255, 0, 127);
    textAlign(RIGHT, TOP);
    text("【終端廢料矩陣】 <<\n✊ 請兩指捏緊或握拳\n(適用: 輻射 / 機油 / 塑料)", width - 25, 30);
}

function processHandTracking() {
    if (hands.length > 0) {
        let hand = hands[0];
        
        // 鏡像座標轉換
        let thumbX = width - hand.thumb_tip.x;
        let thumbY = hand.thumb_tip.y;
        let indexX = width - hand.index_finger_tip.x;
        let indexY = hand.index_finger_tip.y;

        let d = dist(thumbX, thumbY, indexX, indexY);

        // 繪製追蹤粒子
        for (let i = 0; i < hand.keypoints.length; i++) {
            let kp = hand.keypoints[i];
            let kX = width - kp.x;
            let kY = kp.y;
            
            fill(0, 242, 254, 220);
            noStroke();
            ellipse(kX, kY, 6, 6);
        }

        // 手勢判定
        if (d < 50) { 
            currentGesture = "防禦狀態: 偵測到脈衝拳壓 // 磁場調向右側";
            bucketTargetX = width * 0.75;
            
            stroke(255, 0, 127, 230);
            strokeWeight(3);
            line(thumbX, thumbY, indexX, indexY);
            
            fill(255, 0, 127);
            noStroke();
            ellipse((thumbX + indexX) / 2, (thumbY + indexY) / 2, 10, 10);
        } else if (d > 85) {
            currentGesture = "防禦狀態: 偵測到全面張力 // 磁場調向左側";
            bucketTargetX = width * 0.25;
            
            stroke(0, 255, 153, 230);
            strokeWeight(2);
            line(thumbX, thumbY, indexX, indexY);
        }
    } else {
        currentGesture = "安全警告: 未偵測到生物手勢訊號...";
    }
}

function resetItem() {
    itemY = -30;
    itemX = random(120, width - 120);
    itemSpeed = random(4, 5.5) + (score * 0.05);

    if (random(1) > 0.5) {
        itemType = "RECYCLABLE";
        itemName = random(recyclableItems);
    } else {
        itemType = "TRASH";
        itemName = random(trashItems);
    }
}

function manageFallingObjects() {
    itemY += itemSpeed;

    push();
    stroke(0, 242, 254, 200);
    strokeWeight(1.5);
    fill(5, 10, 25, 240);
    rect(itemX, itemY, 150, 36, 4);

    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(13);
    text(itemName, itemX, itemY);
    pop();

    if (itemY >= bucketY - BUCKET_HEIGHT/2 && itemY <= bucketY + BUCKET_HEIGHT/2) {
        if (itemX > bucketX - BUCKET_WIDTH/2 && itemX < bucketX + BUCKET_WIDTH/2) {
            if ((itemType === "RECYCLABLE" && bucketX < width/2) || 
                (itemType === "TRASH" && bucketX > width/2)) {
                score += 10;
            } else {
                score = max(0, score - 5);
            }
            resetItem();
        }
    }

    if (itemY > height + 40) {
        resetItem();
    }
}

function updateTechBucket() {
    bucketX = lerp(bucketX, bucketTargetX, 0.16);

    push();
    if (bucketX < width / 2) {
        stroke(0, 255, 153);
        fill(0, 255, 153, 35);
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = 'rgba(0, 255, 153, 0.7)';
    } else {
        stroke(255, 0, 127);
        fill(255, 0, 127, 35);
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = 'rgba(255, 0, 127, 0.7)';
    }
    
    strokeWeight(2);
    rect(bucketX, bucketY, BUCKET_WIDTH, BUCKET_HEIGHT, 5);

    drawingContext.shadowBlur = 0;
    noStroke();
    fill(255);
    textSize(13);
    textAlign(CENTER, CENTER);
    text(bucketX < width / 2 ? "【 資源回收磁場 】" : " 【 一般廢料磁場 】", bucketX, bucketY);
    pop();
}

function drawUI() {
    fill(0, 242, 254);
    noStroke();
    textSize(20);
    textAlign(CENTER, TOP);
    text("核心同步積分: " + score, width / 2, 25);

    rectMode(CENTER);
    fill(5, 5, 12, 240);
    stroke(0, 242, 254, 70);
    strokeWeight(1);
    rect(width / 2, height - 25, 480, 26, 4);

    noStroke();
    fill(0, 242, 254);
    textSize(11);
    textAlign(CENTER, CENTER);
    text(currentGesture, width / 2, height - 25);
}