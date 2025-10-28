"""
ESS HMI 백엔드 메인 서버
FastAPI + WebSocket으로 실시간 데이터 제공
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from modbus_client import PLCClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ESS HMI API", version="1.0.0")

# 정적 파일 디렉토리 (프로덕션 빌드용)
STATIC_DIR = Path(__file__).parent / "static"

# CORS 설정 (프론트엔드 연동)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 중에는 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PLC 클라이언트 인스턴스
plc_client = PLCClient(host="127.0.0.1", port=502, slave_id=3)

# WebSocket 연결 관리
active_connections: List[WebSocket] = []


# 요청/응답 모델
class PumpCommand(BaseModel):
    pump_index: int  # 0~5
    command: str     # "start" 또는 "stop"


class SettingUpdate(BaseModel):
    address: int
    value: int


@app.on_event("startup")
async def startup_event():
    """서버 시작 시 PLC 연결"""
    logger.info("🚀 ESS HMI 백엔드 서버 시작")
    await asyncio.to_thread(plc_client.connect)
    
    # 실시간 데이터 브로드캐스트 태스크 시작
    asyncio.create_task(broadcast_realtime_data())


@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 PLC 연결 해제"""
    logger.info("🛑 ESS HMI 백엔드 서버 종료")
    await asyncio.to_thread(plc_client.disconnect)


@app.get("/api")
async def api_root():
    """API 루트 엔드포인트"""
    return {
        "service": "ESS HMI Backend",
        "version": "1.0.0",
        "status": "running",
        "plc_connected": plc_client.connected,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/status")
async def get_status():
    """시스템 상태"""
    return {
        "plc_connected": plc_client.connected,
        "plc_host": plc_client.host,
        "plc_port": plc_client.port,
        "active_connections": len(active_connections),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/sensors")
async def get_sensors():
    """센서 데이터 조회"""
    data = await asyncio.to_thread(plc_client.get_sensor_data)
    return {
        "success": True,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/pumps")
async def get_pumps():
    """모든 펌프 데이터 조회"""
    pumps = await asyncio.to_thread(plc_client.get_all_pumps)
    return {
        "success": True,
        "data": pumps,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/pump/{pump_index}")
async def get_pump(pump_index: int):
    """특정 펌프 데이터 조회"""
    if pump_index < 0 or pump_index >= 6:
        raise HTTPException(status_code=400, detail="Invalid pump index (0-5)")
    
    pump = await asyncio.to_thread(plc_client.get_pump_data, pump_index)
    return {
        "success": True,
        "data": pump,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/pump/command")
async def send_pump_command(command: PumpCommand):
    """펌프 명령 전송"""
    if command.pump_index < 0 or command.pump_index >= 6:
        raise HTTPException(status_code=400, detail="Invalid pump index (0-5)")
    
    if command.command not in ["start", "stop"]:
        raise HTTPException(status_code=400, detail="Invalid command (start/stop)")
    
    success = await asyncio.to_thread(plc_client.send_pump_command, command.pump_index, command.command)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send command to PLC")
    
    return {
        "success": True,
        "message": f"Pump {command.pump_index} {command.command} command sent",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/setting")
async def update_setting(setting: SettingUpdate):
    """설정값 업데이트"""
    success = await asyncio.to_thread(plc_client.write_register, setting.address, setting.value)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to write to PLC")
    
    return {
        "success": True,
        "message": f"Register {setting.address} updated to {setting.value}",
        "timestamp": datetime.now().isoformat()
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket 실시간 데이터 스트림"""
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"✅ WebSocket 연결: {len(active_connections)}개 활성")
    
    try:
        while True:
            # 클라이언트 메시지 수신 (연결 유지용)
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
            except asyncio.TimeoutError:
                pass
            
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info(f"❌ WebSocket 연결 해제: {len(active_connections)}개 활성")
    except Exception as e:
        logger.error(f"WebSocket 오류: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)


async def broadcast_realtime_data():
    """모든 WebSocket 클라이언트에 실시간 데이터 브로드캐스트"""
    logger.info("📡 실시간 데이터 브로드캐스트 시작")
    
    # 이전 데이터 캐시 (데이터 읽기 실패 시 사용)
    last_sensors = {}
    last_pumps = []
    
    while True:
        try:
            if active_connections:
                # 센서 및 펌프 데이터 수집
                sensors = await asyncio.to_thread(plc_client.get_sensor_data)
                pumps = await asyncio.to_thread(plc_client.get_all_pumps)
                
                # 데이터 유효성 검사 (모든 값이 0이 아닌지 확인)
                if sensors and any(v != 0 for v in sensors.values()):
                    last_sensors = sensors
                else:
                    sensors = last_sensors  # 이전 데이터 사용
                
                if pumps and len(pumps) > 0:
                    last_pumps = pumps
                else:
                    pumps = last_pumps  # 이전 데이터 사용
                
                message = {
                    "type": "realtime_update",
                    "sensors": sensors,
                    "pumps": pumps,
                    "timestamp": datetime.now().isoformat()
                }
                
                # 모든 연결된 클라이언트에 전송
                disconnected = []
                for connection in active_connections:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"브로드캐스트 오류: {e}")
                        disconnected.append(connection)
                
                # 연결 끊긴 클라이언트 제거
                for conn in disconnected:
                    if conn in active_connections:
                        active_connections.remove(conn)
            
            # 1초 간격 업데이트
            await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"브로드캐스트 루프 오류: {e}")
            await asyncio.sleep(1)


# 정적 파일 서빙 (프로덕션 모드)
if STATIC_DIR.exists():
    logger.info(f"📁 정적 파일 제공: {STATIC_DIR}")
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")
    
    @app.get("/")
    async def serve_frontend():
        """프론트엔드 index.html 제공"""
        return FileResponse(STATIC_DIR / "index.html")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """SPA 라우팅 지원"""
        # API 경로는 제외
        if full_path.startswith("api/") or full_path.startswith("ws"):
            return {"error": "Not found"}, 404
        
        # 파일이 존재하면 제공
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # 그 외는 index.html 반환 (SPA 라우팅)
        return FileResponse(STATIC_DIR / "index.html")
else:
    logger.warning("⚠️  정적 파일 없음 - 개발 모드")
    
    @app.get("/")
    async def root():
        """개발 모드 루트"""
        return {
            "service": "ESS HMI Backend",
            "version": "1.0.0",
            "mode": "development",
            "message": "Frontend should be served separately (npm run dev)",
            "plc_connected": plc_client.connected,
            "timestamp": datetime.now().isoformat()
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )




