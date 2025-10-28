import React, { useState } from 'react'
import './AdvancedControl.css'

function AdvancedControl({ pumps = [] }) {
  const [activeTab, setActiveTab] = useState('automan')

  return (
    <div className="advanced-control">
      <div className="control-header">
        <h2>🎛️ 고급 제어</h2>
        <p>자동/수동 전환, PID 제어, VFD 상세 정보</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="control-tabs">
        <button 
          className={activeTab === 'automan' ? 'active' : ''}
          onClick={() => setActiveTab('automan')}
        >
          🔄 자동/수동
        </button>
        <button 
          className={activeTab === 'pid' ? 'active' : ''}
          onClick={() => setActiveTab('pid')}
        >
          📐 PID 제어
        </button>
        <button 
          className={activeTab === 'vfdinfo' ? 'active' : ''}
          onClick={() => setActiveTab('vfdinfo')}
        >
          ⚡ VFD 정보
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="control-content">
        {activeTab === 'automan' && <AutoManControl pumps={pumps} />}
        {activeTab === 'pid' && <PIDControl />}
        {activeTab === 'vfdinfo' && <VFDInfo pumps={pumps} />}
      </div>
    </div>
  )
}

// 자동/수동 제어
function AutoManControl({ pumps }) {
  const [modes, setModes] = useState({
    SWP1: { auto: true, vfd: true },
    SWP2: { auto: true, vfd: true },
    SWP3: { auto: true, vfd: true },
    FWP1: { auto: true, vfd: true },
    FWP2: { auto: true, vfd: true },
    FWP3: { auto: true, vfd: true },
  })

  const toggleMode = (pumpName, modeType) => {
    setModes(prev => ({
      ...prev,
      [pumpName]: {
        ...prev[pumpName],
        [modeType]: !prev[pumpName][modeType]
      }
    }))
  }

  return (
    <div className="automan-section">
      <div className="automan-description">
        <h3>🔄 운전 모드 설정</h3>
        <p>각 펌프의 운전 모드(자동/수동)와 VFD 모드를 설정할 수 있습니다.</p>
      </div>

      {/* 해수 펌프 */}
      <div className="pump-mode-section">
        <h4>🌊 해수 펌프 (Sea Water Pump)</h4>
        <div className="mode-grid">
          {pumps.slice(0, 3).map((pump, idx) => (
            <PumpModeCard 
              key={idx}
              pump={pump}
              modes={modes[pump.name]}
              onToggle={(type) => toggleMode(pump.name, type)}
            />
          ))}
        </div>
      </div>

      {/* 청수 펌프 */}
      <div className="pump-mode-section">
        <h4>💧 청수 펌프 (Fresh Water Pump)</h4>
        <div className="mode-grid">
          {pumps.slice(3, 6).map((pump, idx) => (
            <PumpModeCard 
              key={idx}
              pump={pump}
              modes={modes[pump.name]}
              onToggle={(type) => toggleMode(pump.name, type)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PumpModeCard({ pump, modes, onToggle }) {
  return (
    <div className="pump-mode-card">
      <div className="mode-card-header">
        <h5>{pump.name}</h5>
        <span className={`status-dot ${pump.running ? 'running' : 'stopped'}`}></span>
      </div>

      <div className="mode-switches">
        <div className="mode-switch">
          <span className="switch-label">운전 모드</span>
          <div className="switch-buttons">
            <button 
              className={modes.auto ? 'active' : ''}
              onClick={() => onToggle('auto')}
            >
              🤖 자동
            </button>
            <button 
              className={!modes.auto ? 'active' : ''}
              onClick={() => onToggle('auto')}
            >
              👤 수동
            </button>
          </div>
        </div>

        <div className="mode-switch">
          <span className="switch-label">VFD 모드</span>
          <div className="switch-buttons">
            <button 
              className={modes.vfd ? 'active' : ''}
              onClick={() => onToggle('vfd')}
            >
              ⚡ VFD
            </button>
            <button 
              className={!modes.vfd ? 'active' : ''}
              onClick={() => onToggle('vfd')}
            >
              🔌 Bypass
            </button>
          </div>
        </div>
      </div>

      <div className="mode-info">
        <div className="info-row">
          <span>주파수:</span>
          <span>{pump.frequency?.toFixed(1) || 0} Hz</span>
        </div>
        <div className="info-row">
          <span>전력:</span>
          <span>{pump.power_kw || 0} kW</span>
        </div>
      </div>
    </div>
  )
}

// PID 제어
function PIDControl() {
  const [pidParams, setPidParams] = useState({
    swp_kp: 1.0,
    swp_ki: 0.1,
    swp_kd: 0.05,
    swp_setpoint: 30.0,
    
    fwp_kp: 1.0,
    fwp_ki: 0.1,
    fwp_kd: 0.05,
    fwp_setpoint: 75.0,
  })

  const handleChange = (key, value) => {
    setPidParams(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }))
  }

  return (
    <div className="pid-section">
      <div className="pid-description">
        <h3>📐 PID 제어 파라미터</h3>
        <p>온도 제어를 위한 PID 게인값을 설정합니다.</p>
        <div className="pid-formula">
          <strong>제어식:</strong> Output = Kp × e(t) + Ki × ∫e(t)dt + Kd × de(t)/dt
        </div>
      </div>

      {/* 해수 펌프 PID */}
      <div className="pid-controller-section">
        <h4>🌊 해수 펌프 PID 파라미터</h4>
        <div className="pid-grid">
          <PIDParameter 
            label="비례 게인 (Kp)" 
            value={pidParams.swp_kp}
            onChange={(v) => handleChange('swp_kp', v)}
            min={0}
            max={10}
            step={0.1}
          />
          <PIDParameter 
            label="적분 게인 (Ki)" 
            value={pidParams.swp_ki}
            onChange={(v) => handleChange('swp_ki', v)}
            min={0}
            max={5}
            step={0.01}
          />
          <PIDParameter 
            label="미분 게인 (Kd)" 
            value={pidParams.swp_kd}
            onChange={(v) => handleChange('swp_kd', v)}
            min={0}
            max={1}
            step={0.01}
          />
          <PIDParameter 
            label="목표값 (Setpoint)" 
            value={pidParams.swp_setpoint}
            onChange={(v) => handleChange('swp_setpoint', v)}
            min={-30}
            max={100}
            step={0.5}
            unit="°C"
          />
        </div>
      </div>

      {/* 청수 펌프 PID */}
      <div className="pid-controller-section">
        <h4>💧 청수 펌프 PID 파라미터</h4>
        <div className="pid-grid">
          <PIDParameter 
            label="비례 게인 (Kp)" 
            value={pidParams.fwp_kp}
            onChange={(v) => handleChange('fwp_kp', v)}
            min={0}
            max={10}
            step={0.1}
          />
          <PIDParameter 
            label="적분 게인 (Ki)" 
            value={pidParams.fwp_ki}
            onChange={(v) => handleChange('fwp_ki', v)}
            min={0}
            max={5}
            step={0.01}
          />
          <PIDParameter 
            label="미분 게인 (Kd)" 
            value={pidParams.fwp_kd}
            onChange={(v) => handleChange('fwp_kd', v)}
            min={0}
            max={1}
            step={0.01}
          />
          <PIDParameter 
            label="목표값 (Setpoint)" 
            value={pidParams.fwp_setpoint}
            onChange={(v) => handleChange('fwp_setpoint', v)}
            min={0}
            max={100}
            step={0.5}
            unit="°C"
          />
        </div>
      </div>

      <div className="pid-footer">
        <button className="btn-apply">💾 PID 파라미터 적용</button>
      </div>
    </div>
  )
}

function PIDParameter({ label, value, onChange, min, max, step, unit = '' }) {
  return (
    <div className="pid-parameter">
      <label>{label}</label>
      <div className="pid-input-group">
        <input 
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
        />
        {unit && <span className="unit">{unit}</span>}
      </div>
      <input 
        type="range"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        className="pid-slider"
      />
    </div>
  )
}

// VFD 상세 정보
function VFDInfo({ pumps }) {
  const [selectedPump, setSelectedPump] = useState(0)

  return (
    <div className="vfdinfo-section">
      <div className="vfdinfo-description">
        <h3>⚡ VFD 상세 정보</h3>
        <p>각 펌프의 VFD(인버터) 상세 운전 정보를 확인합니다.</p>
      </div>

      {/* 펌프 선택 */}
      <div className="pump-selector">
        {pumps.map((pump, idx) => (
          <button 
            key={idx}
            className={`pump-select-btn ${selectedPump === idx ? 'active' : ''}`}
            onClick={() => setSelectedPump(idx)}
          >
            {pump.name}
          </button>
        ))}
      </div>

      {/* 선택된 펌프의 VFD 정보 */}
      {pumps[selectedPump] && (
        <VFDDetailCard pump={pumps[selectedPump]} />
      )}
    </div>
  )
}

function VFDDetailCard({ pump }) {
  return (
    <div className="vfd-detail-card">
      <div className="vfd-header">
        <h4>{pump.name} VFD 상세 정보</h4>
        <span className={`vfd-status ${pump.running ? 'running' : 'stopped'}`}>
          {pump.running ? '🟢 운전중' : '⚪ 정지'}
        </span>
      </div>

      <div className="vfd-info-grid">
        <div className="vfd-info-section">
          <h5>📊 운전 데이터</h5>
          <VFDInfoRow label="현재 주파수" value={`${pump.frequency?.toFixed(1) || 0} Hz`} />
          <VFDInfoRow label="출력 주파수" value={`${pump.frequency?.toFixed(1) || 0} Hz`} />
          <VFDInfoRow label="목표 주파수" value={`60.0 Hz`} />
          <VFDInfoRow label="현재 전류" value={`${(pump.power_kw * 2.5).toFixed(1)} A`} />
          <VFDInfoRow label="출력 전압" value={`380 V`} />
        </div>

        <div className="vfd-info-section">
          <h5>⚡ 전력 데이터</h5>
          <VFDInfoRow label="순시 전력" value={`${pump.power_kw || 0} kW`} />
          <VFDInfoRow label="평균 전력" value={`${pump.avg_power || 0} kW`} />
          <VFDInfoRow label="역률" value={`0.95`} />
          <VFDInfoRow label="효율" value={`94.5 %`} />
          <VFDInfoRow 
            label="절감률" 
            value={`${pump.saved_ratio || 0} %`} 
            highlight 
          />
        </div>

        <div className="vfd-info-section">
          <h5>🕐 운전 시간</h5>
          <VFDInfoRow 
            label="ESS 운전 시간" 
            value={`${pump.run_hours?.toLocaleString() || 0} h`} 
          />
          <VFDInfoRow 
            label="총 운전 시간" 
            value={`${(pump.run_hours * 1.5)?.toLocaleString() || 0} h`} 
          />
          <VFDInfoRow 
            label="절감 전력량" 
            value={`${pump.saved_kwh?.toLocaleString() || 0} kWh`} 
            highlight 
          />
        </div>

        <div className="vfd-info-section">
          <h5>🛡️ 상태 정보</h5>
          <VFDInfoRow label="운전 모드" value={pump.ess_mode ? 'ESS 모드' : '일반 모드'} />
          <VFDInfoRow label="제어 모드" value={`자동`} />
          <VFDInfoRow label="VFD 온도" value={`42 °C`} />
          <VFDInfoRow label="모터 온도" value={`38 °C`} />
          <VFDInfoRow label="알람 상태" value={`정상`} success />
        </div>
      </div>
    </div>
  )
}

function VFDInfoRow({ label, value, highlight, success }) {
  return (
    <div className="vfd-info-row">
      <span className="vfd-label">{label}</span>
      <span className={`vfd-value ${highlight ? 'highlight' : ''} ${success ? 'success' : ''}`}>
        {value}
      </span>
    </div>
  )
}

export default AdvancedControl




