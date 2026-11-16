const {app, BrowserWindow, Menu, globalShortcut, ipcMain} = require('electron');
const path = require('path');
const robot = require('robotjs'); // OS 레벨 마우스/키보드 제어 라이브러리

let win;
let macroInterval = null;

// 글로벌 상태 관리 변수
let macroActive = false;
let clickTarget = "left";  // left | right | keyboard_a | nothing
let clickType = "single";  // single | double
let cpsValue = 10;

function createWindow() {
    win = new BrowserWindow({
        width: 660,
        height: 360,
        resizable: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // contextBridge 보안 설정
            nodeIntegration: false,
            contextIsolation: true
        },
    });

    win.loadFile('index.html');
}

// 매크로 실행 루프 함수
function startMacroLoop() {
    if (macroInterval) clearInterval(macroInterval);
    if (cpsValue <= 0) return;

    const intervalTime = 1000 / cpsValue; // CPS → 간격(ms)

    macroInterval = setInterval(() => {
        if (!macroActive) return;

        if (clickTarget === "nothing") {
            return;
        } else if (clickTarget === "keyboard_a") {
            robot.keyTap("a");
        } else {
            // left 또는 right 버튼 클릭
            const isDouble = clickType === "double";
            robot.mouseClick(clickTarget, isDouble);
        }
    }, intervalTime);
}

function stopMacroLoop() {
    if (macroInterval) {
        clearInterval(macroInterval);
        macroInterval = null;
    }
}

// 앱 준비 완료 시 설정
app.whenReady().then(() => {
    createWindow();

    // 전역 단축키 F8 등록
    globalShortcut.register('F8', () => {
        win.webContents.send('global-f8-pressed');
    });
});

// 창 제어
ipcMain.on('minimize-app', () => win.minimize());
ipcMain.on('close-app', () => win.close());

// 설정 동기화 수신
ipcMain.on('update-settings', (event, data) => {
    clickTarget = data.clickTarget;
    clickType = data.clickType;
    cpsValue = parseInt(data.cpsValue);
    console.log(`[설정 동기화] 대상:${clickTarget}, 타입:${clickType}, CPS:${cpsValue}`);

    // 실행 중 설정 변경 시 루프 재시작
    if (macroActive) {
        startMacroLoop();
    }
});

// 매크로 시작/중지 제어 (invoke/handle 패턴)
ipcMain.handle('control-macro', (event, action) => {
    if (action === 'start' && !macroActive) {
        macroActive = true;
        startMacroLoop();
        return 'STARTED';
    } else if (action === 'stop') {
        macroActive = false;
        stopMacroLoop();
        return 'STOPPED';
    }
    return null;
});

// 앱 종료 시 단축키 해제
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
