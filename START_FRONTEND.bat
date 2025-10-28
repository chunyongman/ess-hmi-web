@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo    프론트엔드 서버 단독 실행
echo ============================================================
echo.
echo [안내] 백엔드 서버가 먼저 실행되어 있어야 합니다.
echo.

REM Node 모듈 확인
if not exist "frontend\node_modules" (
    echo [오류] Node 모듈이 설치되지 않았습니다.
    echo.
    echo [해결방법] frontend 폴더에서 다음 명령을 실행하세요:
    echo        npm install
    echo.
    pause
    exit /b 1
)

echo [시작] 프론트엔드 서버 실행 중...
echo.
cd frontend
npm run dev
pause

