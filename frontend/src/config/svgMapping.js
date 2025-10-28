// SVG Symbol ID와 센서/펌프 데이터 매핑 설정
// 실제 SVG 파일에서 확인한 ID 기반

export const sensorMapping = {
  // 온도 센서 - SVG에 라벨만 있고 값 표시 요소는 동적 추가 필요
  TX1: { labelId: 'text147', unit: '°C', decimal: 1 },
  TX2: { labelId: 'text1125', unit: '°C', decimal: 1 },
  TX3: { labelId: 'text1147', unit: '°C', decimal: 1 },
  TX4A: { labelId: 'text278', unit: '°C', decimal: 1 },  // 백엔드에서 TX4A로 전송
  TX5A: { labelId: 'text1151', unit: '°C', decimal: 1 }, // 백엔드에서 TX5A로 전송

  // 압력 센서 (백엔드에서 PX1로 전송)
  PX1: { labelId: 'text1073', unit: ' kg/cm²', decimal: 2 },
}

export const pumpMapping = {
  // LT (Fresh Water) Pumps
  0: { // LT Pump No.1
    name: 'LT_Pump_1',
    symbolIds: {
      mode: 'text1201',           // MAN 표시
      hz: 'LT_Pump1_Hz',          // Hz(VFD) 표시
      runningHour: 'text1262'     // Running hour 표시
    }
  },
  1: { // LT Pump No.2
    name: 'LT_Pump_2',
    symbolIds: {
      mode: 'text1218',
      hz: 'LT_Pump2_Hz',
      runningHour: 'text1290'
    }
  },
  2: { // LT Pump No.3
    name: 'LT_Pump_3',
    symbolIds: {
      mode: 'text1235',
      hz: 'LT_Pump3_Hz',
      runningHour: 'text1318'
    }
  },

  // SW (Sea Water) Pumps
  3: { // SW Pump No.1
    name: 'SW_Pump_1',
    symbolIds: {
      mode: 'text1335',
      hz: 'SW_Pump1_Hz',
      runningHour: 'text1396'
    }
  },
  4: { // SW Pump No.2
    name: 'SW_Pump_2',
    symbolIds: {
      mode: 'text1352',
      hz: 'text1414',
      runningHour: 'text1423'
    }
  },
  5: { // SW Pump No.3
    name: 'SW_Pump_3',
    symbolIds: {
      mode: 'text1369',
      hz: 'SW_Pump3_Hz',
      runningHour: 'text1450'
    }
  }
}
