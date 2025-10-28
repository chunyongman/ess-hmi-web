"""
Modbus TCP 클라이언트 모듈
PLC와의 통신을 담당합니다.
"""

import logging
from typing import Optional, Dict, Any, List
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class PLCClient:
    """PLC Modbus TCP 클라이언트"""
    
    def __init__(self, host: str = "127.0.0.1", port: int = 502, slave_id: int = 3):
        self.host = host
        self.port = port
        self.slave_id = slave_id
        self.client: Optional[ModbusTcpClient] = None
        self.connected = False
        
    def connect(self) -> bool:
        """PLC 연결"""
        try:
            self.client = ModbusTcpClient(
                host=self.host,
                port=self.port,
                timeout=3
            )
            self.connected = self.client.connect()
            
            if self.connected:
                logger.info(f"✅ PLC 연결 성공: {self.host}:{self.port}")
            else:
                logger.error(f"❌ PLC 연결 실패: {self.host}:{self.port}")
                
            return self.connected
            
        except Exception as e:
            logger.error(f"❌ PLC 연결 오류: {e}")
            self.connected = False
            return False
    
    def disconnect(self):
        """PLC 연결 해제"""
        if self.client:
            self.client.close()
            self.connected = False
            logger.info("PLC 연결 해제")
    
    def read_holding_registers(self, address: int, count: int) -> Optional[List[int]]:
        """홀딩 레지스터 읽기"""
        if not self.connected or not self.client:
            logger.info("연결되지 않음 - 재연결 시도")
            self.connect()
            
        if not self.connected:
            logger.error("연결 실패 - None 반환")
            return None
            
        try:
            result = self.client.read_holding_registers(
                address=address,
                count=count,
                slave=self.slave_id
            )
            
            if result.isError():
                logger.error(f"레지스터 읽기 오류: {result}")
                return None
                
            logger.debug(f"레지스터 읽기 성공: address={address}, count={count}, data={result.registers}")
            return result.registers
            
        except Exception as e:
            logger.error(f"레지스터 읽기 예외: {e}")
            self.connected = False
            return None
    
    def write_register(self, address: int, value: int) -> bool:
        """단일 레지스터 쓰기"""
        if not self.connected:
            self.connect()
            
        if not self.connected:
            return False
            
        try:
            result = self.client.write_register(
                address=address,
                value=value,
                slave=self.slave_id
            )
            
            if result.isError():
                logger.error(f"레지스터 쓰기 오류: {result}")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"레지스터 쓰기 예외: {e}")
            self.connected = False
            return False
    
    def get_sensor_data(self) -> Dict[str, Any]:
        """센서 데이터 읽기"""
        
        # W10~W19: 온도, 압력, 부하 센서
        sensor_regs = self.read_holding_registers(10, 10)
        
        logger.info(f"센서 레지스터 읽기 결과: {sensor_regs}")
        
        if not sensor_regs:
            logger.warning("센서 데이터 없음 - 기본값 반환")
            return self._get_default_sensor_data()
        
        return {
            "TX1": round(sensor_regs[0] / 10.0, 1),  # CSW 펌프 토출 온도
            "TX2": round(sensor_regs[1] / 10.0, 1),  # FW Cooler 1 SW Out
            "TX3": round(sensor_regs[2] / 10.0, 1),  # FW Cooler 2 SW Out
            "TX4A": round(sensor_regs[3] / 10.0, 1), # FW Cooler 1 FW In
            "TX5A": round(sensor_regs[4] / 10.0, 1), # FW Cooler 1 FW Out
            "TX4B": round(sensor_regs[5] / 10.0, 1), # FW Cooler 2 FW In
            "TX5B": round(sensor_regs[6] / 10.0, 1), # FW Cooler 2 FW Out
            "PX1": round(sensor_regs[7] / 4608.0, 2), # 압력 (kg/cm2)
            "PU1": round(sensor_regs[9] / 276.48, 1), # M/E 부하 (%)
        }
    
    def get_pump_data(self, pump_index: int) -> Dict[str, Any]:
        """
        펌프 데이터 읽기
        pump_index: 0=SWP1, 1=SWP2, 2=SWP3, 3=FWP1, 4=FWP2, 5=FWP3
        """
        
        # 펌프별 데이터 시작 주소
        data_offsets = [160, 168, 176, 184, 192, 200]
        bit_offsets = [0, 3, 6, 9, 12, 15]
        
        if pump_index < 0 or pump_index >= 6:
            return {}
        
        # 운전 상태 비트 (W0)
        status_regs = self.read_holding_registers(0, 2)
        
        # VFD 데이터 (W160+offset)
        offset = data_offsets[pump_index]
        vfd_regs = self.read_holding_registers(offset, 8)
        
        if not status_regs or not vfd_regs:
            return self._get_default_pump_data(pump_index)
        
        bit_offset = bit_offsets[pump_index]
        running = bool(status_regs[0] & (1 << bit_offset))
        ess_on = bool(status_regs[0] & (1 << (bit_offset + 1)))
        
        return {
            "name": ["SWP1", "SWP2", "SWP3", "FWP1", "FWP2", "FWP3"][pump_index],
            "running": running,
            "ess_mode": ess_on,
            "frequency": round(vfd_regs[0] / 10.0, 1),
            "power_kw": vfd_regs[1],
            "avg_power": vfd_regs[2],
            "saved_kwh": vfd_regs[3] + (vfd_regs[4] << 16),
            "saved_ratio": vfd_regs[5],
            "run_hours": vfd_regs[6] + (vfd_regs[7] << 16),
        }
    
    def get_all_pumps(self) -> List[Dict[str, Any]]:
        """모든 펌프 데이터 읽기"""
        pumps = []
        for i in range(6):
            pump_data = self.get_pump_data(i)
            pumps.append(pump_data)
        return pumps
    
    def send_pump_command(self, pump_index: int, command: str) -> bool:
        """
        펌프 명령 전송
        command: "start" 또는 "stop"
        """
        
        # W50: PUMP_INDEX, W51: PUMP_CMD
        success = self.write_register(50, pump_index)
        if not success:
            return False
        
        cmd_value = 1 if command == "start" else 2 if command == "stop" else 0
        success = self.write_register(51, cmd_value)
        
        if success:
            logger.info(f"펌프 {pump_index} 명령 전송: {command}")
        
        return success
    
    def _get_default_sensor_data(self) -> Dict[str, Any]:
        """기본 센서 데이터 (통신 실패 시)"""
        return {
            "TX1": 0.0, "TX2": 0.0, "TX3": 0.0,
            "TX4A": 0.0, "TX5A": 0.0, "TX4B": 0.0, "TX5B": 0.0,
            "PX1": 0.0, "PU1": 0.0
        }
    
    def _get_default_pump_data(self, pump_index: int) -> Dict[str, Any]:
        """기본 펌프 데이터 (통신 실패 시)"""
        return {
            "name": ["SWP1", "SWP2", "SWP3", "FWP1", "FWP2", "FWP3"][pump_index],
            "running": False,
            "ess_mode": False,
            "frequency": 0.0,
            "power_kw": 0,
            "avg_power": 0,
            "saved_kwh": 0,
            "saved_ratio": 0,
            "run_hours": 0,
        }

