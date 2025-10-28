@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo    ESS HMI 시스템 종료
echo ============================================================
echo.
echo [주의] 실행 중인 모든 HMI 관련 프로세스를 종료합니다.
echo.
pause

echo.
echo [1/4] PLC 시뮬레이터 종료 중...
taskkill /FI "WindowTitle eq PLC 시뮬레이터*" /F >nul 2>&1
if %errorlevel% == 0 (
    echo     ✓ 시뮬레이터 종료 완료
) else (
    echo     - 시뮬레이터가 실행 중이 아닙니다
)

echo.
echo [2/4] 백엔드 서버 종료 중...
taskkill /FI "WindowTitle eq 백엔드 서버*" /F >nul 2>&1
if %errorlevel% == 0 (
    echo     ✓ 백엔드 종료 완료
) else (
    echo     - 백엔드가 실행 중이 아닙니다
)

echo.
echo [3/4] 프론트엔드 서버 종료 중...
taskkill /FI "WindowTitle eq 프론트엔드*" /F >nul 2>&1
if %errorlevel% == 0 (
    echo     ✓ 프론트엔드 종료 완료
) else (
    echo     - 프론트엔드가 실행 중이 아닙니다
)

echo.
echo [4/4] 포트 점유 프로세스 확인 및 종료...
REM 포트 8000 (백엔드)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
REM 포트 3000 (프론트엔드)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
REM 포트 502 (시뮬레이터)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :502 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo     ✓ 포트 정리 완료

echo.
echo ============================================================
echo    ✓ 모든 서비스가 종료되었습니다!
echo ============================================================
echo.
pause

