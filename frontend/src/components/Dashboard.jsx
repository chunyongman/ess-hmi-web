import React from 'react'
import './Dashboard.css'

function Dashboard({ sensors = {}, pumps = [] }) {
  const swPumps = pumps.slice(0, 3) // SWP1, SWP2, SWP3
  const fwPumps = pumps.slice(3, 6) // FWP1, FWP2, FWP3

  const totalSavedKwh = pumps.reduce((sum, pump) => sum + (pump.saved_kwh || 0), 0)
  const totalRunHours = pumps.reduce((sum, pump) => sum + (pump.run_hours || 0), 0)
  const runningPumps = pumps.filter(p => p.running).length

  return (
    <div className="dashboard">
      {/* 시스템 개요 */}
      <section className="dashboard-section">
        <h2>📊 시스템 개요</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-label">총 절감 전력</div>
              <div className="stat-value">{totalSavedKwh.toLocaleString()} kWh</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-label">총 운전 시간</div>
              <div className="stat-value">{totalRunHours.toLocaleString()} h</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <div className="stat-label">운전 중인 펌프</div>
              <div className="stat-value">{runningPumps} / {pumps.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-label">M/E 부하</div>
              <div className="stat-value">{sensors.PU1?.toFixed(1) || 0}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 센서 데이터 */}
      <section className="dashboard-section">
        <h2>🌡️ 센서 데이터</h2>
        <div className="sensor-grid">
          <SensorCard label="CSW 펌프 토출 온도" value={sensors.TX1} unit="°C" icon="🌡️" />
          <SensorCard label="FW Cooler 1 SW Out" value={sensors.TX2} unit="°C" icon="❄️" />
          <SensorCard label="FW Cooler 2 SW Out" value={sensors.TX3} unit="°C" icon="❄️" />
          <SensorCard label="FW Cooler 1 FW In" value={sensors.TX4A} unit="°C" icon="🔥" />
          <SensorCard label="FW Cooler 1 FW Out" value={sensors.TX5A} unit="°C" icon="💧" />
          <SensorCard label="FW Cooler 2 FW In" value={sensors.TX4B} unit="°C" icon="🔥" />
          <SensorCard label="FW Cooler 2 FW Out" value={sensors.TX5B} unit="°C" icon="💧" />
          <SensorCard label="CSW 펌프 토출 압력" value={sensors.PX1} unit="kg/cm²" icon="💨" />
        </div>
      </section>

      {/* 해수 펌프 (SWP) */}
      <section className="dashboard-section">
        <h2>🌊 해수 펌프 (Sea Water Pump)</h2>
        <div className="pump-grid">
          {swPumps.map((pump, idx) => (
            <PumpCard key={idx} pump={pump} />
          ))}
        </div>
      </section>

      {/* 청수 펌프 (FWP) */}
      <section className="dashboard-section">
        <h2>💧 청수 펌프 (Fresh Water Pump)</h2>
        <div className="pump-grid">
          {fwPumps.map((pump, idx) => (
            <PumpCard key={idx} pump={pump} />
          ))}
        </div>
      </section>
    </div>
  )
}

function SensorCard({ label, value, unit, icon }) {
  return (
    <div className="sensor-card">
      <div className="sensor-icon">{icon}</div>
      <div className="sensor-info">
        <div className="sensor-label">{label}</div>
        <div className="sensor-value">
          {value !== undefined ? value.toFixed(1) : '--'} {unit}
        </div>
      </div>
    </div>
  )
}

function PumpCard({ pump }) {
  const isRunning = pump.running
  const avgSavingRatio = pump.saved_ratio || 0

  return (
    <div className={`pump-card ${isRunning ? 'running' : 'stopped'}`}>
      <div className="pump-header">
        <h3>{pump.name}</h3>
        <span className={`pump-status-badge ${isRunning ? 'active' : 'inactive'}`}>
          {isRunning ? '🟢 운전중' : '⚪ 정지'}
        </span>
      </div>
      
      <div className="pump-details">
        <div className="pump-detail-row">
          <span className="detail-label">주파수</span>
          <span className="detail-value">{pump.frequency?.toFixed(1) || 0} Hz</span>
        </div>
        <div className="pump-detail-row">
          <span className="detail-label">소비 전력</span>
          <span className="detail-value">{pump.power_kw || 0} kW</span>
        </div>
        <div className="pump-detail-row">
          <span className="detail-label">절감 전력</span>
          <span className="detail-value highlight">{pump.saved_kwh?.toLocaleString() || 0} kWh</span>
        </div>
        <div className="pump-detail-row">
          <span className="detail-label">절감률</span>
          <span className="detail-value highlight">{avgSavingRatio}%</span>
        </div>
        <div className="pump-detail-row">
          <span className="detail-label">운전 시간</span>
          <span className="detail-value">{pump.run_hours?.toLocaleString() || 0} h</span>
        </div>
      </div>
      
      {pump.ess_mode && (
        <div className="ess-badge">⚡ ESS 모드</div>
      )}
    </div>
  )
}

export default Dashboard




