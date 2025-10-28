import React, { useState } from 'react'
import './History.css'

function History() {
  const [activeTab, setActiveTab] = useState('alarms')

  // 데모 데이터
  const alarmHistory = [
    { id: 1, time: '2025-10-18 14:30:15', level: 'warning', message: 'NO.1 SWP VFD Communication error', acknowledged: true },
    { id: 2, time: '2025-10-18 12:15:23', level: 'critical', message: 'PLC FAULT', acknowledged: true },
    { id: 3, time: '2025-10-18 10:45:10', level: 'info', message: 'System Start', acknowledged: true },
    { id: 4, time: '2025-10-17 18:20:05', level: 'warning', message: 'CSW PP DISC TEMP SENSOR FAULT', acknowledged: true },
  ]

  const eventHistory = [
    { id: 1, time: '2025-10-18 14:35:20', type: 'control', user: 'Admin', message: 'SWP1 시작 명령' },
    { id: 2, time: '2025-10-18 14:30:15', type: 'alarm', user: 'System', message: 'VFD 통신 오류 발생' },
    { id: 3, time: '2025-10-18 13:45:30', type: 'setting', user: 'Admin', message: '온도 설정값 변경: 30°C → 32°C' },
    { id: 4, time: '2025-10-18 12:00:00', type: 'system', user: 'System', message: '자동 리포트 생성' },
  ]

  return (
    <div className="history">
      <div className="history-header">
        <h2>📋 이력 관리</h2>
        <p>알람 이력, 이벤트 로그, 운전 이력 조회</p>
      </div>

      <div className="history-tabs">
        <button 
          className={activeTab === 'alarms' ? 'active' : ''}
          onClick={() => setActiveTab('alarms')}
        >
          🔔 알람 이력
        </button>
        <button 
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          📝 이벤트 로그
        </button>
        <button 
          className={activeTab === 'operation' ? 'active' : ''}
          onClick={() => setActiveTab('operation')}
        >
          ⚙️ 운전 이력
        </button>
      </div>

      <div className="history-content">
        {activeTab === 'alarms' && <AlarmHistory data={alarmHistory} />}
        {activeTab === 'events' && <EventHistory data={eventHistory} />}
        {activeTab === 'operation' && <OperationHistory />}
      </div>
    </div>
  )
}

// 알람 이력
function AlarmHistory({ data }) {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = data.filter(alarm => {
    if (filter !== 'all' && alarm.level !== filter) return false
    if (searchTerm && !alarm.message.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <div className="alarm-history">
      <div className="history-controls">
        <div className="filter-group">
          <label>필터:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">전체</option>
            <option value="critical">위험</option>
            <option value="warning">경고</option>
            <option value="info">정보</option>
          </select>
        </div>
        <div className="search-group">
          <input 
            type="text" 
            placeholder="🔍 알람 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-export">📥 CSV 내보내기</button>
      </div>

      <div className="history-table">
        <table>
          <thead>
            <tr>
              <th>시간</th>
              <th>등급</th>
              <th>메시지</th>
              <th>확인</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(alarm => (
              <tr key={alarm.id}>
                <td>{alarm.time}</td>
                <td>
                  <span className={`level-badge ${alarm.level}`}>
                    {alarm.level === 'critical' && '🔴 위험'}
                    {alarm.level === 'warning' && '🟡 경고'}
                    {alarm.level === 'info' && '🟢 정보'}
                  </span>
                </td>
                <td>{alarm.message}</td>
                <td>
                  <span className={`ack-badge ${alarm.acknowledged ? 'ack' : 'unack'}`}>
                    {alarm.acknowledged ? '✅ 확인됨' : '⏳ 대기중'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="history-summary">
        <div className="summary-item">
          <span className="summary-label">총 알람:</span>
          <span className="summary-value">{data.length}건</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">위험:</span>
          <span className="summary-value critical">
            {data.filter(a => a.level === 'critical').length}건
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">경고:</span>
          <span className="summary-value warning">
            {data.filter(a => a.level === 'warning').length}건
          </span>
        </div>
      </div>
    </div>
  )
}

// 이벤트 로그
function EventHistory({ data }) {
  const [filter, setFilter] = useState('all')

  const filtered = data.filter(event => {
    if (filter !== 'all' && event.type !== filter) return false
    return true
  })

  const getTypeIcon = (type) => {
    switch(type) {
      case 'control': return '🎮'
      case 'alarm': return '🔔'
      case 'setting': return '⚙️'
      case 'system': return '💻'
      default: return '📝'
    }
  }

  return (
    <div className="event-history">
      <div className="history-controls">
        <div className="filter-group">
          <label>이벤트 유형:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">전체</option>
            <option value="control">제어</option>
            <option value="alarm">알람</option>
            <option value="setting">설정</option>
            <option value="system">시스템</option>
          </select>
        </div>
        <button className="btn-export">📥 CSV 내보내기</button>
      </div>

      <div className="event-list">
        {filtered.map(event => (
          <div key={event.id} className="event-item">
            <div className="event-icon">{getTypeIcon(event.type)}</div>
            <div className="event-content">
              <div className="event-header">
                <span className="event-time">{event.time}</span>
                <span className="event-user">{event.user}</span>
              </div>
              <div className="event-message">{event.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 운전 이력
function OperationHistory() {
  const operationData = [
    { pump: 'SWP1', date: '2025-10-18', runtime: 18.5, energy: 125, saved: 45 },
    { pump: 'SWP2', date: '2025-10-18', runtime: 5.5, energy: 38, saved: 12 },
    { pump: 'FWP1', date: '2025-10-18', runtime: 22.0, energy: 156, saved: 58 },
  ]

  return (
    <div className="operation-history">
      <div className="history-controls">
        <div className="date-range">
          <label>조회 기간:</label>
          <input type="date" defaultValue="2025-10-18" />
          <span>~</span>
          <input type="date" defaultValue="2025-10-18" />
        </div>
        <button className="btn-search">🔍 조회</button>
        <button className="btn-export">📥 리포트 생성</button>
      </div>

      <div className="operation-table">
        <table>
          <thead>
            <tr>
              <th>펌프</th>
              <th>날짜</th>
              <th>운전 시간</th>
              <th>소비 전력</th>
              <th>절감 전력</th>
              <th>절감률</th>
            </tr>
          </thead>
          <tbody>
            {operationData.map((row, idx) => (
              <tr key={idx}>
                <td><strong>{row.pump}</strong></td>
                <td>{row.date}</td>
                <td>{row.runtime} h</td>
                <td>{row.energy} kWh</td>
                <td className="highlight">{row.saved} kWh</td>
                <td className="highlight">{((row.saved / row.energy) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan="2"><strong>합계</strong></td>
              <td><strong>{operationData.reduce((sum, r) => sum + r.runtime, 0)} h</strong></td>
              <td><strong>{operationData.reduce((sum, r) => sum + r.energy, 0)} kWh</strong></td>
              <td className="highlight"><strong>{operationData.reduce((sum, r) => sum + r.saved, 0)} kWh</strong></td>
              <td className="highlight"><strong>36.1%</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="operation-chart">
        <h4>📊 일별 절감 전력 추이</h4>
        <div className="chart-placeholder">
          <p>차트는 실제 데이터가 누적되면 표시됩니다</p>
        </div>
      </div>
    </div>
  )
}

export default History




