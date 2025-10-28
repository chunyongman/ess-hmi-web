import React, { useEffect, useRef, useState } from 'react'
import { sensorMapping, pumpMapping } from '../config/svgMapping'
import svgDiagram from '../assets/cooling_diagram_new.svg?raw'
import './DynamicSVGDiagram.css'

function DynamicSVGDiagram({ sensors = {}, pumps = [], onPumpCommand }) {
  const svgContainerRef = useRef(null)
  const [svgLoaded, setSvgLoaded] = useState(false)
  const [selectedPump, setSelectedPump] = useState(null)

  useEffect(() => {
    // SVG 파일을 직접 삽입
    if (svgContainerRef.current && !svgLoaded) {
      svgContainerRef.current.innerHTML = svgDiagram
      setSvgLoaded(true)
      addPumpClickHandlers()
    }
  }, [])

  const addPumpClickHandlers = () => {
    if (!svgContainerRef.current) return
    const svgElement = svgContainerRef.current.querySelector('svg')
    if (!svgElement) return

    // 펌프별 클릭 영역 정의 (SVG 상의 실제 위치 기반)
    const pumpAreas = [
      // LT Pumps (왼쪽)
      { index: 0, name: 'LT Pump No.1', x: 240, y: 360, width: 65, height: 60 },
      { index: 1, name: 'LT Pump No.2', x: 240, y: 447, width: 65, height: 60 },
      { index: 2, name: 'LT Pump No.3', x: 240, y: 557, width: 65, height: 60 },
      // SW Pumps (아래쪽)
      { index: 3, name: 'SW Pump No.1', x: 585, y: 478, width: 65, height: 60 },
      { index: 4, name: 'SW Pump No.2', x: 680, y: 478, width: 65, height: 60 },
      { index: 5, name: 'SW Pump No.3', x: 770, y: 478, width: 65, height: 60 },
    ]

    pumpAreas.forEach(area => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', area.x)
      rect.setAttribute('y', area.y)
      rect.setAttribute('width', area.width)
      rect.setAttribute('height', area.height)
      rect.setAttribute('fill', 'transparent')
      rect.setAttribute('cursor', 'pointer')
      rect.setAttribute('data-pump-index', area.index)

      rect.addEventListener('click', () => {
        handlePumpClick(area.index)
      })

      svgElement.appendChild(rect)
    })
  }

  const handlePumpClick = (pumpIndex) => {
    if (pumps[pumpIndex]) {
      setSelectedPump({ ...pumps[pumpIndex], index: pumpIndex })
      console.log(`펌프 ${pumpIndex} 클릭됨`)
    }
  }

  useEffect(() => {
    // 센서 및 펌프 데이터가 변경될 때마다 SVG 업데이트
    if (svgLoaded) {
      updateSVGData()
    }
  }, [sensors, pumps, svgLoaded])

  const updateSVGData = () => {
    if (!svgContainerRef.current) return

    const svgElement = svgContainerRef.current.querySelector('svg')
    if (!svgElement) {
      console.warn('SVG 요소를 찾을 수 없습니다')
      return
    }

    console.log('📊 데이터 업데이트:', { sensors, pumps })

    // 센서 데이터 업데이트 - 러닝아워와 동일한 스타일로 표시
    Object.keys(sensorMapping).forEach(sensorKey => {
      const mapping = sensorMapping[sensorKey]
      const labelElement = svgElement.querySelector(`#${mapping.labelId}`)

      if (labelElement && sensors[sensorKey] !== undefined) {
        const value = sensors[sensorKey].toFixed(mapping.decimal)
        const groupId = `${sensorKey}_group`
        const bgId = `${sensorKey}_bg`
        const valueId = `${sensorKey}_value`

        // 기존 그룹이 있으면 삭제 (스타일 재적용 위해)
        let oldGroup = svgElement.querySelector(`#${groupId}`)
        if (oldGroup) {
          oldGroup.remove()
        }

        // 새로 생성
        let groupElement = null
        let bgRect = null
        let textElement = null

        // 라벨 위치 정보 가져오기
        const transform = labelElement.getAttribute('transform')
        const match = transform?.match(/matrix\(([\d\.\s\-]+)\)/)

        if (match) {
          const matrixValues = match[1].split(' ').map(Number)
          const baseX = matrixValues[4] + 25  // 라벨 오른쪽
          let baseY = matrixValues[5]

          // TX5A는 위로 이동 (라인과 겹치지 않게)
          if (sensorKey === 'TX5A') {
            baseY = baseY - 10
          }

          // 그룹 생성
          groupElement = document.createElementNS('http://www.w3.org/2000/svg', 'g')
          groupElement.setAttribute('id', groupId)

          // 회색 배경 박스 (러닝아워 스타일)
          bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
          bgRect.setAttribute('id', bgId)
          bgRect.setAttribute('x', baseX)
          bgRect.setAttribute('y', baseY - 10)
          bgRect.setAttribute('width', '35')  // 초기 크기
          bgRect.setAttribute('height', '12')
          bgRect.setAttribute('fill', '#D3D3D3')  // 회색 배경
          bgRect.setAttribute('stroke', 'none')  // 테두리 없음
          bgRect.setAttribute('rx', '2')

          // 검은색 텍스트 (러닝아워 스타일) - 진한 글씨
          textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          textElement.setAttribute('id', valueId)
          textElement.setAttribute('x', baseX + 3)
          textElement.setAttribute('y', baseY - 2)
          textElement.setAttribute('font-family', 'Arial, sans-serif')  // Arial로 통일
          textElement.setAttribute('font-size', '9px')  // 약간 크게
          textElement.setAttribute('fill', '#000000')  // 검은색
          textElement.setAttribute('font-weight', '700')  // 숫자로 명시
          textElement.style.fontWeight = '700'  // CSS로도 명시
          textElement.textContent = `${value}${mapping.unit}`

          groupElement.appendChild(bgRect)
          groupElement.appendChild(textElement)
          labelElement.parentNode.appendChild(groupElement)

          // 텍스트 크기에 맞춰 박스 크기 자동 조정
          try {
            const bbox = textElement.getBBox()
            bgRect.setAttribute('width', bbox.width + 6)  // 여백 포함
          } catch (e) {
            // getBBox 실패 시 기본 크기 유지
          }

          console.log(`✅ ${sensorKey} 값 표시 박스 생성 (진한 글씨)`)
        }
      }
    })

    // 펌프 데이터 업데이트
    pumps.forEach((pump, index) => {
      const mapping = pumpMapping[index]
      if (!mapping) {
        console.warn(`펌프 ${index} 매핑 정보 없음`)
        return
      }

      console.log(`펌프 ${index} 업데이트:`, pump)

      // 모드 업데이트 (AUTO/MAN)
      const modeElement = svgElement.querySelector(`#${mapping.symbolIds.mode}`)
      if (modeElement) {
        // auto 필드가 없으면 기본값 MAN 사용
        const isAuto = pump.auto !== undefined ? pump.auto : false
        modeElement.textContent = isAuto ? 'AUTO' : 'MAN'
        modeElement.setAttribute('fill', isAuto ? 'green' : 'orange')
        console.log(`✅ 펌프 ${index} 모드 업데이트: ${isAuto ? 'AUTO' : 'MAN'}`)
      } else {
        console.warn(`❌ 펌프 ${index} 모드 요소 없음: #${mapping.symbolIds.mode}`)
      }

      // Hz 업데이트
      const hzElement = svgElement.querySelector(`#${mapping.symbolIds.hz}`)
      if (hzElement) {
        hzElement.textContent = pump.frequency ? `${pump.frequency.toFixed(1)} Hz` : '0.0 Hz'
        console.log(`✅ 펌프 ${index} Hz 업데이트: ${pump.frequency}`)
      } else {
        console.warn(`❌ 펌프 ${index} Hz 요소 없음: #${mapping.symbolIds.hz}`)
      }

      // Running Hour 업데이트
      const hourElement = svgElement.querySelector(`#${mapping.symbolIds.runningHour}`)
      if (hourElement) {
        hourElement.textContent = pump.run_hours ? `${pump.run_hours} h` : '0 h'
        console.log(`✅ 펌프 ${index} 운전시간 업데이트: ${pump.run_hours}`)
      } else {
        console.warn(`❌ 펌프 ${index} 운전시간 요소 없음: #${mapping.symbolIds.runningHour}`)
      }

      // 주파수는 항상 검은색으로 표시
      if (hzElement) {
        hzElement.setAttribute('fill', '#000000')
        hzElement.setAttribute('font-weight', 'bold')
      }
    })
  }

  const sendPumpCommand = async (pumpIndex, command) => {
    if (onPumpCommand) {
      const success = await onPumpCommand(pumpIndex, command)
      if (success) {
        alert(`펌프 ${pumpIndex + 1} ${command === 'start' ? '시작' : '정지'} 명령 전송 완료`)
        setSelectedPump(null)
      } else {
        alert('명령 전송 실패')
      }
    }
  }

  return (
    <div className="dynamic-svg-diagram">
      <div
        ref={svgContainerRef}
        className="svg-container"
      />

      {/* 펌프 정보 팝업 */}
      {selectedPump && (
        <div className="pump-popup-overlay" onClick={() => setSelectedPump(null)}>
          <div className="pump-popup" onClick={(e) => e.stopPropagation()}>
            <div className="pump-popup-header">
              <h3>
                {selectedPump.index < 3 ? 'LT' : 'SW'} Pump No.{(selectedPump.index % 3) + 1}
              </h3>
              <button className="popup-close" onClick={() => setSelectedPump(null)}>×</button>
            </div>

            <div className="pump-popup-body">
              <div className="pump-info-row">
                <span className="info-label">상태:</span>
                <span className={`info-value ${selectedPump.running ? 'status-running' : 'status-stopped'}`}>
                  {selectedPump.running ? '🟢 운전 중' : '⚪ 정지'}
                </span>
              </div>

              <div className="pump-info-row">
                <span className="info-label">모드:</span>
                <span className="info-value">
                  {selectedPump.auto !== undefined ? (selectedPump.auto ? 'AUTO' : 'MANUAL') : 'MANUAL'}
                </span>
              </div>

              <div className="pump-info-row">
                <span className="info-label">주파수:</span>
                <span className="info-value">{selectedPump.frequency?.toFixed(1) || '0.0'} Hz</span>
              </div>

              <div className="pump-info-row">
                <span className="info-label">전력:</span>
                <span className="info-value">{selectedPump.power_kw || 0} kW</span>
              </div>

              <div className="pump-info-row">
                <span className="info-label">평균 전력:</span>
                <span className="info-value">{selectedPump.avg_power || 0} kW</span>
              </div>

              <div className="pump-info-row">
                <span className="info-label">절감 전력:</span>
                <span className="info-value">{selectedPump.saved_kwh?.toLocaleString() || 0} kWh</span>
              </div>

              <div className="pump-info-row">
                <span className="info-label">운전 시간:</span>
                <span className="info-value">{selectedPump.run_hours?.toLocaleString() || 0} h</span>
              </div>

              <div className="pump-info-row">
                <span className="info-label">ESS 모드:</span>
                <span className="info-value">{selectedPump.ess_mode ? '🟢 활성' : '⚪ 비활성'}</span>
              </div>
            </div>

            <div className="pump-popup-controls">
              <button
                className="btn-pump-start"
                onClick={() => sendPumpCommand(selectedPump.index, 'start')}
                disabled={selectedPump.running}
              >
                ▶️ START
              </button>
              <button
                className="btn-pump-stop"
                onClick={() => sendPumpCommand(selectedPump.index, 'stop')}
                disabled={!selectedPump.running}
              >
                ⏹️ STOP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicSVGDiagram
