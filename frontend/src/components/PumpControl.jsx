import React, { useState } from 'react'
import './PumpControl.css'

function PumpControl({ pumps = [], onCommand }) {
  const [selectedPump, setSelectedPump] = useState(null)
  const [commandInProgress, setCommandInProgress] = useState(false)

  const handleCommand = async (pumpIndex, command) => {
    setCommandInProgress(true)
    try {
      const success = await onCommand(pumpIndex, command)
      if (success) {
        alert(`✅ 펌프 ${pumps[pumpIndex]?.name} ${command === 'start' ? '시작' : '정지'} 명령 성공`)
      } else {
        alert(`❌ 펌프 명령 실패`)
      }
    } catch (error) {
      alert(`❌ 오류: ${error.message}`)
    } finally {
      setCommandInProgress(false)
    }
  }

  return (
    <div className="pump-control">
      <div className="control-header">
        <h2>⚙️ 펌프 제어</h2>
        <p>펌프를 선택하고 시작/정지 명령을 내릴 수 있습니다.</p>
      </div>

      <div className="control-grid">
        {/* 해수 펌프 */}
        <section className="control-section">
          <h3>🌊 해수 펌프 (Sea Water Pump)</h3>
          <div className="pump-control-list">
            {pumps.slice(0, 3).map((pump, idx) => (
              <PumpControlCard
                key={idx}
                pump={pump}
                pumpIndex={idx}
                onStart={() => handleCommand(idx, 'start')}
                onStop={() => handleCommand(idx, 'stop')}
                disabled={commandInProgress}
                isSelected={selectedPump === idx}
                onSelect={() => setSelectedPump(idx)}
              />
            ))}
          </div>
        </section>

        {/* 청수 펌프 */}
        <section className="control-section">
          <h3>💧 청수 펌프 (Fresh Water Pump)</h3>
          <div className="pump-control-list">
            {pumps.slice(3, 6).map((pump, idx) => (
              <PumpControlCard
                key={idx + 3}
                pump={pump}
                pumpIndex={idx + 3}
                onStart={() => handleCommand(idx + 3, 'start')}
                onStop={() => handleCommand(idx + 3, 'stop')}
                disabled={commandInProgress}
                isSelected={selectedPump === idx + 3}
                onSelect={() => setSelectedPump(idx + 3)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* 선택된 펌프 상세 정보 */}
      {selectedPump !== null && pumps[selectedPump] && (
        <div className="pump-detail-panel">
          <h3>📋 {pumps[selectedPump].name} 상세 정보</h3>
          <div className="detail-grid">
            <DetailItem label="운전 상태" value={pumps[selectedPump].running ? '🟢 운전중' : '⚪ 정지'} />
            <DetailItem label="ESS 모드" value={pumps[selectedPump].ess_mode ? '⚡ 활성' : '⚫ 비활성'} />
            <DetailItem label="현재 주파수" value={`${pumps[selectedPump].frequency?.toFixed(1)} Hz`} />
            <DetailItem label="현재 전력" value={`${pumps[selectedPump].power_kw} kW`} />
            <DetailItem label="평균 전력" value={`${pumps[selectedPump].avg_power} kW`} />
            <DetailItem label="절감 전력량" value={`${pumps[selectedPump].saved_kwh?.toLocaleString()} kWh`} />
            <DetailItem label="절감률" value={`${pumps[selectedPump].saved_ratio}%`} />
            <DetailItem label="운전 시간" value={`${pumps[selectedPump].run_hours?.toLocaleString()} h`} />
          </div>
        </div>
      )}
    </div>
  )
}

function PumpControlCard({ pump, pumpIndex, onStart, onStop, disabled, isSelected, onSelect }) {
  return (
    <div 
      className={`pump-control-card ${isSelected ? 'selected' : ''} ${pump.running ? 'running' : 'stopped'}`}
      onClick={onSelect}
    >
      <div className="control-card-header">
        <h4>{pump.name}</h4>
        <span className={`status-indicator ${pump.running ? 'active' : 'inactive'}`}>
          {pump.running ? '🟢 운전중' : '⚪ 정지'}
        </span>
      </div>

      <div className="control-card-info">
        <div className="info-item">
          <span className="info-label">주파수</span>
          <span className="info-value">{pump.frequency?.toFixed(1) || 0} Hz</span>
        </div>
        <div className="info-item">
          <span className="info-label">전력</span>
          <span className="info-value">{pump.power_kw || 0} kW</span>
        </div>
      </div>

      <div className="control-buttons">
        <button 
          className="btn-start" 
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          disabled={disabled || pump.running}
        >
          ▶️ 시작
        </button>
        <button 
          className="btn-stop" 
          onClick={(e) => { e.stopPropagation(); onStop(); }}
          disabled={disabled || !pump.running}
        >
          ⏸️ 정지
        </button>
      </div>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-item-label">{label}</span>
      <span className="detail-item-value">{value}</span>
    </div>
  )
}

export default PumpControl




