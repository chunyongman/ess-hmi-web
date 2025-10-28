@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo    백엔드 서버 단독 실행
echo ============================================================
echo.
echo [안내] PLC 시뮬레이터가 먼저 실행되어 있어야 합니다.
echo.

REM 가상환경 확인
if not exist "backend\venv\Scripts\python.exe" (
    echo [오류] Python 가상환경이 없습니다.
    echo.
    echo [해결방법] backend 폴더에서 다음 명령을 실행하세요:
    echo        python -m venv venv
    echo        venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo [시작] 백엔드 서버 실행 중...
echo.
cd backend
venv\Scripts\python.exe main.py
pause

