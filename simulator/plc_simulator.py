#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ESS HMI PLC 시뮬레이터
선박용 냉각 시스템 PLC를 시뮬레이션합니다.
"""

import sys
import io
import time
import random
import threading
from datetime import datetime

# Windows 콘솔 인코딩 문제 해결
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext
    from pymodbus.datastore import ModbusSequentialDataBlock
    from pymodbus.server import StartTcpServer
except ImportError:
    print("ERROR: pymodbus library is required.")
    print("Install: pip install pymodbus")
    sys.exit(1)


class ESSPLCSimulator:
    """ESS PLC 시뮬레이터 클래스"""
    
    def __init__(self):
        print("=" * 60)
        print("[ESS HMI] PLC 시뮬레이터 시작")
        print("=" * 60)
        
        # Modbus 데이터 스토어 초기화 (10000개 레지스터)
        self.store = ModbusSlaveContext(
            di=ModbusSequentialDataBlock(0, [0]*10000),    # Discrete Inputs
            co=ModbusSequentialDataBlock(0, [0]*10000),    # Coils
            hr=ModbusSequentialDataBlock(0, [0]*10000),    # Holding Registers
            ir=ModbusSequentialDataBlock(0, [0]*10000)     # Input Registers
        )
        
        # 시뮬레이션 상태
        self.running = True
        self.me_load = 50  # M/E 부하 (%)
        self.departure_mode = False
        
        # 펌프 상태 (6개 펌프) - 초기 설정: SWP1,2 / FWP1,2 작동
        self.pumps = {
            'SWP1': {'running': True, 'hz': 50, 'mode': 'vfd', 'auto': True},
            'SWP2': {'running': True, 'hz': 48, 'mode': 'vfd', 'auto': True},
            'SWP3': {'running': False, 'hz': 0, 'mode': 'vfd', 'auto': True},
            'FWP1': {'running': True, 'hz': 52, 'mode': 'vfd', 'auto': True},
            'FWP2': {'running': True, 'hz': 50, 'mode': 'vfd', 'auto': True},
            'FWP3': {'running': False, 'hz': 0, 'mode': 'vfd', 'auto': True},
        }
        
        # 센서 베이스 값
        self.base_temp = 30.0  # 기본 온도
        self.base_pressure = 3.5  # 기본 압력
        
        print("[OK] 데이터 스토어 초기화 완료")
        print("[INFO] Modbus TCP 서버: 127.0.0.1:502")
        print("[INFO] Node ID: 3")
        print("-" * 60)
    
    def temperature_to_raw(self, temp_celsius):
        """온도를 PLC raw 값으로 변환 (-24.3~100°C -> -243~1000)"""
        return int(temp_celsius * 10)
    
    def pressure_to_raw(self, pressure_kgcm2):
        """압력을 PLC raw 값으로 변환 (0~6 kg/cm2 -> 0~27648)"""
        return int(pressure_kgcm2 * 4608)
    
    def percentage_to_raw(self, percentage):
        """퍼센트를 PLC raw 값으로 변환 (0~100% -> 0~27648)"""
        return int(percentage * 276.48)
    
    def hz_to_raw(self, hz):
        """주파수를 PLC raw 값으로 변환 (0~100Hz -> 0~1000)"""
        return int(hz * 10)
    
    def simulate_sensor_values(self):
        """센서 값 시뮬레이션"""
        while self.running:
            try:
                # 온도 시뮬레이션 (K400010~K400016: W010~W016)
                # TX1: CSW 펌프 토출 온도
                temp_variation = random.uniform(-2, 2)
                tx1 = self.base_temp + temp_variation
                self.store.setValues(3, 10, [self.temperature_to_raw(tx1)])
                
                # TX2, TX3: 청수 냉각기 해수 출구 온도
                tx2 = self.base_temp + random.uniform(-1, 3)
                tx3 = self.base_temp + random.uniform(-1, 3)
                self.store.setValues(3, 11, [self.temperature_to_raw(tx2)])
                self.store.setValues(3, 12, [self.temperature_to_raw(tx3)])
                
                # TX4A, TX5A: 청수 냉각기 1 입/출구
                tx4a = 75 + random.uniform(-5, 5)
                tx5a = 60 + random.uniform(-3, 3)
                self.store.setValues(3, 13, [self.temperature_to_raw(tx4a)])
                self.store.setValues(3, 14, [self.temperature_to_raw(tx5a)])
                
                # TX4B, TX5B: 청수 냉각기 2 입/출구
                tx4b = 75 + random.uniform(-5, 5)
                tx5b = 60 + random.uniform(-3, 3)
                self.store.setValues(3, 15, [self.temperature_to_raw(tx4b)])
                self.store.setValues(3, 16, [self.temperature_to_raw(tx5b)])
                
                # PX1: 압력 (K400017: W017)
                pressure = self.base_pressure + random.uniform(-0.2, 0.2)
                self.store.setValues(3, 17, [self.pressure_to_raw(pressure)])
                
                # PU1: M/E 부하 (K400019: W019)
                self.me_load += random.uniform(-2, 2)
                self.me_load = max(10, min(100, self.me_load))
                self.store.setValues(3, 19, [self.percentage_to_raw(self.me_load)])
                
                # 펌프 상태 업데이트
                self.update_pump_status()
                
                # 통신 카운터 증가 (K400260: W260)
                current_count = self.store.getValues(3, 260, 1)[0]
                self.store.setValues(3, 260, [(current_count + 1) % 65535])
                
                time.sleep(1)  # 1초마다 업데이트
                
            except Exception as e:
                print(f"[ERROR] 센서 시뮬레이션 오류: {e}")
                time.sleep(1)
    
    def update_pump_status(self):
        """펌프 상태 및 VFD 데이터 업데이트"""
        
        pump_configs = [
            ('SWP1', 0, 160, 40),   # name, bit_offset, data_offset, max_kw
            ('SWP2', 3, 168, 40),
            ('SWP3', 6, 176, 40),
            ('FWP1', 9, 184, 30),
            ('FWP2', 12, 192, 30),
            ('FWP3', 15, 200, 30),
        ]
        
        for pump_name, bit_offset, data_offset, max_kw in pump_configs:
            pump = self.pumps[pump_name]
            
            # 운전 상태 비트 (K4000.x: W0)
            running_bit = bit_offset
            esson_bit = bit_offset + 1
            
            if pump['running']:
                self.set_bit(0, running_bit, True)   # RUNNING
                self.set_bit(0, esson_bit, True)     # ESS ON
                
                # 주파수 자동 조정
                if pump['auto']:
                    target_hz = 30 + (self.me_load * 0.5)  # 부하에 따라 조정
                    if pump['hz'] < target_hz:
                        pump['hz'] = min(pump['hz'] + 0.5, target_hz)
                    elif pump['hz'] > target_hz:
                        pump['hz'] = max(pump['hz'] - 0.5, target_hz)
                
                # VFD 데이터 (K400160+offset: W160+offset)
                hz_raw = self.hz_to_raw(pump['hz'])
                power_kw = int((pump['hz'] / 60.0) ** 3 * max_kw)  # 3제곱 법칙
                avg_kw = power_kw + random.randint(-2, 2)
                saved_kwh = random.randint(1000, 10000)
                saved_ratio = int((1 - (pump['hz'] / 60.0) ** 3) * 100)
                run_hours = random.randint(100, 5000)
                
                # K400160+i (Hz, KW, AKW 등)
                self.store.setValues(3, data_offset, [hz_raw])
                self.store.setValues(3, data_offset + 1, [power_kw])
                self.store.setValues(3, data_offset + 2, [avg_kw])
                # Double Word (saved kWh) - 2개 워드
                self.store.setValues(3, data_offset + 3, [saved_kwh % 65536])
                self.store.setValues(3, data_offset + 4, [saved_kwh // 65536])
                self.store.setValues(3, data_offset + 5, [saved_ratio])
                # Double Word (run hours) - 2개 워드
                self.store.setValues(3, data_offset + 6, [run_hours % 65536])
                self.store.setValues(3, data_offset + 7, [run_hours // 65536])
                
            else:
                self.set_bit(0, running_bit, False)
                self.set_bit(0, esson_bit, False)
                
                # 정지 상태: 모두 0
                self.store.setValues(3, data_offset, [0] * 8)
    
    def set_bit(self, word_addr, bit_position, value):
        """특정 워드의 비트를 설정"""
        current = self.store.getValues(3, word_addr, 1)[0]
        if value:
            new_value = current | (1 << bit_position)
        else:
            new_value = current & ~(1 << bit_position)
        self.store.setValues(3, word_addr, [new_value])
    
    def monitor_commands(self):
        """HMI 명령 모니터링"""
        print("[INFO] 명령 모니터링 시작...")
        
        while self.running:
            try:
                # PUMP_CMD 확인 (K400051: W051)
                pump_idx = self.store.getValues(3, 50, 1)[0]  # PUMP_INDEX
                pump_cmd = self.store.getValues(3, 51, 1)[0]  # PUMP_CMD
                
                if pump_cmd != 0:
                    pump_names = ['SWP1', 'SWP2', 'SWP3', 'FWP1', 'FWP2', 'FWP3']
                    if 0 <= pump_idx < len(pump_names):
                        pump_name = pump_names[pump_idx]
                        
                        if pump_cmd == 1:  # START
                            self.pumps[pump_name]['running'] = True
                            print(f"[CMD] {pump_name} 시작 명령 수신")
                        elif pump_cmd == 2:  # STOP
                            self.pumps[pump_name]['running'] = False
                            print(f"[CMD] {pump_name} 정지 명령 수신")
                        
                        # 명령 초기화
                        self.store.setValues(3, 51, [0])
                
                time.sleep(0.5)
                
            except Exception as e:
                print(f"[ERROR] 명령 모니터링 오류: {e}")
                time.sleep(1)
    
    def print_status(self):
        """상태 출력"""
        while self.running:
            try:
                time.sleep(5)
                
                print("\n" + "=" * 60)
                print(f"[STATUS] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print("-" * 60)
                print(f"M/E Load: {self.me_load:.1f}%")
                print(f"Temp: TX1={self.base_temp:.1f}C")
                print(f"Press: PX1={self.base_pressure:.1f} kg/cm2")
                print("-" * 60)
                print("해수 펌프 (Sea Water Pumps):")
                for i, name in enumerate(['SWP1', 'SWP2', 'SWP3'], 1):
                    pump = self.pumps[name]
                    status = "RUNNING" if pump['running'] else "STOPPED"
                    print(f"  {name}: {status:8} | {pump['hz']:5.1f}Hz | {'AUTO' if pump['auto'] else 'MANUAL'}")
                
                print("청수 펌프 (Fresh Water Pumps):")
                for i, name in enumerate(['FWP1', 'FWP2', 'FWP3'], 1):
                    pump = self.pumps[name]
                    status = "RUNNING" if pump['running'] else "STOPPED"
                    print(f"  {name}: {status:8} | {pump['hz']:5.1f}Hz | {'AUTO' if pump['auto'] else 'MANUAL'}")
                
                print("=" * 60)
                
            except Exception as e:
                print(f"[ERROR] 상태 출력 오류: {e}")
                time.sleep(5)
    
    def start(self):
        """시뮬레이터 시작"""
        
        # 시스템 상태 초기화
        self.store.setValues(3, 40, [0] * 20)  # 알람 비트 초기화
        
        # 초기 설정값 입력
        self.store.setValues(3, 60, [self.temperature_to_raw(30)])   # SWP_OP_Temp
        self.store.setValues(3, 63, [self.pressure_to_raw(3.5)])     # SWP_PRS
        
        # 초기 펌프 상태 설정 (중요!)
        self.update_pump_status()
        
        # 백그라운드 스레드 시작
        threading.Thread(target=self.simulate_sensor_values, daemon=True).start()
        threading.Thread(target=self.monitor_commands, daemon=True).start()
        threading.Thread(target=self.print_status, daemon=True).start()
        
        print("\n[OK] 시뮬레이터 준비 완료!")
        print("[INFO] HMI 프로그램에서 127.0.0.1:502로 연결하세요.")
        print("[INFO] 초기 설정:")
        print("       - 해수 펌프: SWP1(50Hz), SWP2(48Hz) 작동 중")
        print("       - 청수 펌프: FWP1(52Hz), FWP2(50Hz) 작동 중")
        print("[INFO] 종료하려면 Ctrl+C를 누르세요.\n")
        
        # Modbus TCP 서버 시작
        context = ModbusServerContext(slaves={3: self.store}, single=False)
        
        try:
            # 동기 서버 사용 (더 안정적)
            print("[INFO] Modbus TCP 서버 시작 중...")
            StartTcpServer(
                context=context,
                address=("0.0.0.0", 502)
            )
        except KeyboardInterrupt:
            print("\n\n[INFO] 시뮬레이터 종료 중...")
            self.running = False
        except Exception as e:
            print(f"\n[ERROR] 서버 시작 실패: {e}")
            print("[INFO] 포트 502는 관리자 권한이 필요합니다.")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    try:
        simulator = ESSPLCSimulator()
        simulator.start()
    except Exception as e:
        print(f"\n[FATAL] 치명적 오류: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
