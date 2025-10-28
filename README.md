# 🚢 ESS HMI 웹 시스템

선박용 에너지 저장 시스템(ESS) 냉각 제어를 위한 현대적인 웹 기반 HMI 시스템입니다.

## ✨ 주요 기능

### 🎯 실시간 모니터링
- **냉각 시스템 다이어그램**: 실시간 온도, 압력, 유량 표시
- **펌프 상태**: 6개 펌프(SWP1-3, FWP1-3) 운전 상태 및 VFD 데이터
- **센서 데이터**: 온도(TX1-TX5B), 압력(PX1), M/E 부하(PU1)
- **WebSocket 실시간 업데이트**: 1초 간격 자동 갱신

### 🎮 제어 기능
- **펌프 제어**: START/STOP 원격 제어
- **ESS 모드**: 에너지 절감 모드 활성화/비활성화
- **설정값 조정**: 온도, 압력 설정값 변경

### 📊 데이터 분석
- **트렌드 차트**: 실시간 데이터 그래프
- **히스토리**: 과거 데이터 조회 및 분석
- **알람 패널**: 시스템 알람 모니터링

### 🧪 시뮬레이터 모드
- **가상 PLC**: 실제 PLC 없이 시스템 테스트 가능
- **실시간 데이터 생성**: 실제와 유사한 센서 데이터 시뮬레이션
- **펌프 제어 시뮬레이션**: HMI 명령에 반응하는 가상 펌프

## 🚀 빠른 시작

### 1️⃣ 시뮬레이터 모드 (PLC 없이 테스트)

**관리자 권한으로 실행:**

```batch
start_with_simulator.bat
```

또는 PowerShell:

```powershell
.\start_with_simulator.ps1
```

자동으로 다음이 실행됩니다:
- PLC 시뮬레이터 (포트 502)
- 백엔드 서버 (포트 8000)
- 프론트엔드 (포트 5173)

브라우저에서 `http://localhost:5173` 접속

### 2️⃣ 실제 PLC 연결 모드

1. `backend/main.py`에서 PLC IP 주소 설정:
   ```python
   plc_client = PLCClient(host="192.168.1.100", port=502, slave_id=3)
   ```

2. 시스템 시작:
   ```batch
   start.bat
   ```

## 📦 설치

### 필수 요구사항
- **Python**: 3.8 이상
- **Node.js**: 16 이상
- **관리자 권한**: 시뮬레이터 실행 시 필요 (포트 502 사용)

### 백엔드 설정

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 프론트엔드 설정

```bash
cd frontend
npm install
```

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐
│   프론트엔드     │  React + Vite
│  (Port 5173)    │  WebSocket 클라이언트
└────────┬────────┘
         │ WebSocket + REST API
┌────────▼────────┐
│   백엔드 서버    │  FastAPI + uvicorn
│  (Port 8000)    │  WebSocket 서버
└────────┬────────┘
         │ Modbus TCP
┌────────▼────────┐
│   PLC / 시뮬레이터│  Modbus TCP Server
│   (Port 502)    │  Node ID: 3
└─────────────────┘
```

## 📁 프로젝트 구조

```
ess-hmi-web/
├── backend/                    # FastAPI 백엔드
│   ├── main.py                # 메인 서버
│   ├── modbus_client.py       # Modbus TCP 클라이언트
│   ├── requirements.txt       # Python 의존성
│   └── venv/                  # Python 가상환경
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── App.jsx           # 메인 앱
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CoolingSystem.jsx
│   │   │   ├── PumpControl.jsx
│   │   │   ├── TrendChart.jsx
│   │   │   └── ...
│   │   └── assets/           # 이미지, 아이콘
│   ├── package.json
│   └── vite.config.js
│
├── simulator/                  # PLC 시뮬레이터
│   └── plc_simulator.py       # 가상 PLC
│
├── start_with_simulator.bat   # 시뮬레이터 모드 시작
├── start_simulator_only.bat   # 시뮬레이터만 시작
├── start.bat                  # 실제 PLC 모드 시작
├── 시뮬레이터_사용_가이드.md    # 시뮬레이터 가이드
└── README.md                  # 이 파일
```

## 🔧 개발

### 백엔드 개발 서버

```bash
cd backend
venv\Scripts\activate
python main.py
```

API 문서: `http://localhost:8000/docs`

### 프론트엔드 개발 서버

```bash
cd frontend
npm run dev
```

개발 서버: `http://localhost:5173`

### 시뮬레이터 단독 실행

**관리자 권한으로:**

```bash
cd backend
venv\Scripts\activate
python ..\simulator\plc_simulator.py
```

## 📡 API 엔드포인트

### REST API
- `GET /`: 서버 상태
- `GET /api/status`: 시스템 상태
- `GET /api/sensors`: 센서 데이터
- `GET /api/pumps`: 모든 펌프 데이터
- `GET /api/pump/{index}`: 특정 펌프 데이터
- `POST /api/pump/command`: 펌프 제어 명령
- `POST /api/setting`: 설정값 변경

### WebSocket
- `ws://localhost:8000/ws`: 실시간 데이터 스트림

## 🎨 화면 구성

1. **대시보드**: 시스템 전체 개요
2. **냉각 시스템**: 실시간 다이어그램
3. **펌프 제어**: 개별 펌프 제어 및 모니터링
4. **트렌드 차트**: 시계열 데이터 분석
5. **알람**: 알람 이력 및 현황
6. **히스토리**: 과거 데이터 조회
7. **설정**: 시스템 설정

## 🔐 보안

- **프로덕션 환경**: CORS 설정 변경 필요
- **인증**: 필요 시 JWT 인증 추가 권장
- **HTTPS**: 프로덕션에서는 HTTPS 사용 권장

## 🐛 문제 해결

### 시뮬레이터 관련
- **"관리자 권한 필요"**: 배치 파일을 관리자 권한으로 실행
- **"포트 502 사용 불가"**: 다른 프로그램이 포트 사용 중
- **데이터가 0으로 표시**: 시뮬레이터 실행 확인

자세한 내용은 `시뮬레이터_사용_가이드.md` 참조

### 백엔드 관련
- **PLC 연결 실패**: IP 주소 및 포트 확인
- **모듈 없음 오류**: `pip install -r requirements.txt` 실행

### 프론트엔드 관련
- **페이지 로딩 안됨**: `npm install` 실행 확인
- **WebSocket 연결 실패**: 백엔드 서버 실행 확인

## 📚 문서

- [시뮬레이터 사용 가이드](시뮬레이터_사용_가이드.md)
- [빠른 실행 가이드](빠른_실행_가이드.md)
- [사용자 가이드](사용자_가이드.md)
- [배포 가이드](HMI_배포_가이드.md)

## 🛠️ 기술 스택

### 백엔드
- **FastAPI**: 고성능 Python 웹 프레임워크
- **pymodbus**: Modbus TCP 통신
- **uvicorn**: ASGI 서버
- **WebSocket**: 실시간 양방향 통신

### 프론트엔드
- **React**: UI 라이브러리
- **Vite**: 빌드 도구
- **Recharts**: 차트 라이브러리
- **CSS3**: 스타일링

### 시뮬레이터
- **pymodbus**: Modbus TCP 서버
- **Python threading**: 멀티스레드 시뮬레이션

## 📄 라이선스

이 프로젝트는 내부 사용을 위한 것입니다.

## 🤝 기여

프로젝트 개선 제안이나 버그 리포트는 환영합니다.

---

**🎉 ESS HMI 시스템으로 효율적인 냉각 시스템 관리를 경험하세요!**

