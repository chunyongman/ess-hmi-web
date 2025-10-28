@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo    ESS HMI 의존성 설치
echo ============================================================
echo.
echo 이 스크립트는 백엔드와 프론트엔드의 필요한 패키지를 설치합니다.
echo.
pause

echo.
echo ============================================================
echo [1/2] 백엔드 Python 패키지 설치
echo ============================================================
echo.

REM Python 확인
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Python이 설치되어 있지 않습니다.
    echo        https://www.python.org/downloads/ 에서 Python을 설치하세요.
    echo.
    pause
    exit /b 1
)

echo [1-1] 가상환경 생성 중...
cd backend
if exist "venv" (
    echo     - 가상환경이 이미 존재합니다.
) else (
    python -m venv venv
    echo     ✓ 가상환경 생성 완료
)

echo.
echo [1-2] Python 패키지 설치 중...
venv\Scripts\pip install --upgrade pip
venv\Scripts\pip install -r requirements.txt
echo     ✓ Python 패키지 설치 완료
cd ..

echo.
echo ============================================================
echo [2/2] 프론트엔드 Node 패키지 설치
echo ============================================================
echo.

REM Node.js 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo        https://nodejs.org/ 에서 Node.js를 설치하세요.
    echo.
    pause
    exit /b 1
)

echo [2-1] Node 패키지 설치 중...
cd frontend
if exist "node_modules" (
    echo     - node_modules가 이미 존재합니다. 업데이트 중...
)
call npm install
echo     ✓ Node 패키지 설치 완료
cd ..

echo.
echo ============================================================
echo    ✓ 모든 의존성 설치 완료!
echo ============================================================
echo.
echo [다음 단계]
echo    - START_HMI.bat 파일을 실행하여 시스템을 시작하세요.
echo.
pause

