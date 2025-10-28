@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo    ESS HMI 시스템 시작
echo ============================================================
echo.
echo [안내] 관리자 권한으로 실행 중인지 확인하세요.
echo        (시뮬레이터는 502번 포트를 사용하므로 관리자 권한 필요)
echo.

REM 가상환경 확인
if not exist "backend\venv\Scripts\python.exe" (
    echo [오류] Python 가상환경이 없습니다.
    echo        backend\venv\Scripts\python.exe 를 찾을 수 없습니다.
    echo.
    echo [해결방법] backend 폴더에서 다음 명령을 실행하세요:
    echo        python -m venv venv
    echo        venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM Node 모듈 확인
if not exist "frontend\node_modules" (
    echo [경고] Node 모듈이 설치되지 않았습니다.
    echo        frontend\node_modules 를 찾을 수 없습니다.
    echo.
    echo [해결방법] frontend 폴더에서 다음 명령을 실행하세요:
    echo        npm install
    echo.
    pause
    exit /b 1
)

echo [1/3] PLC 시뮬레이터 시작 중...
start "PLC 시뮬레이터" cmd /k "cd /d %~dp0 && backend\venv\Scripts\python.exe simulator\plc_simulator.py"
timeout /t 5 /nobreak >nul
echo     ✓ 시뮬레이터 시작 완료
echo.

echo [2/3] 백엔드 서버 시작 중...
start "백엔드 서버" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe main.py"
timeout /t 5 /nobreak >nul
echo     ✓ 백엔드 시작 완료
echo.

echo [3/3] 프론트엔드 서버 시작 중...
start "프론트엔드" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo     ✓ 프론트엔드 시작 완료
echo.

echo ============================================================
echo    ✓ 모든 서비스가 시작되었습니다!
echo ============================================================
echo.
echo [접속 정보]
echo    - PLC 시뮬레이터: 127.0.0.1:502
echo    - 백엔드 API: http://localhost:8000
echo    - 프론트엔드: http://localhost:3000
echo.
echo [사용 방법]
echo    1. 브라우저에서 http://localhost:3000 을 열어주세요
echo    2. 실시간 데이터가 1초마다 업데이트됩니다
echo.
echo [종료 방법]
echo    - STOP_HMI.bat 파일을 실행하거나
echo    - 각 창(시뮬레이터, 백엔드, 프론트엔드)을 닫으면 됩니다
echo    - 또는 각 창에서 Ctrl+C를 눌러 종료하세요
echo.
echo [자동 브라우저 실행]
timeout /t 3 /nobreak >nul
start http://localhost:3000
echo.
pause


