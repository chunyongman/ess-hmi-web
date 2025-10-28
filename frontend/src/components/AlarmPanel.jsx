import React, { useState } from 'react'
import './AlarmPanel.css'

function AlarmPanel() {
  // 데모용 알람 데이터
  const [alarms] = useState([
    { id: 1, level: 'info', message: '시스템 정상 작동 중', time: new Date().toISOString(), acknowledged: true },
    { id: 2, level: 'warning', message: 'PLC 통신 지연 감지', time: new Date(Date.now() - 300000).toISOString(), acknowledged: false },
  ])

  const getAlarmIcon = (level) => {
    switch (level) {
      case 'critical': return '🔴'
      case 'warning': return '🟡'
      case 'info': return '🟢'
      default: return '⚪'
    }
  }

  const getAlarmClass = (level) => {
    switch (level) {
      case 'critical': return 'alarm-critical'
      case 'warning': return 'alarm-warning'
      case 'info': return 'alarm-info'
      default: return 'alarm-normal'
    }
  }

  return (
    <div className="alarm-panel">
      <div className="alarm-header">
        <h2>🔔 알람 시스템</h2>
        <div className="alarm-summary">
          <span className="summary-item critical">위험: 0</span>
          <span className="summary-item warning">경고: 1</span>
          <span className="summary-item info">정보: 1</span>
        </div>
      </div>

      <div className="alarm-list">
        {alarms.length === 0 ? (
          <div className="no-alarms">
            <span>✅ 활성 알람이 없습니다</span>
          </div>
        ) : (
          alarms.map(alarm => (
            <div key={alarm.id} className={`alarm-item ${getAlarmClass(alarm.level)} ${alarm.acknowledged ? 'acknowledged' : ''}`}>
              <div className="alarm-icon">
                {getAlarmIcon(alarm.level)}
              </div>
              <div className="alarm-content">
                <div className="alarm-message">{alarm.message}</div>
                <div className="alarm-time">{new Date(alarm.time).toLocaleString('ko-KR')}</div>
              </div>
              <div className="alarm-actions">
                {!alarm.acknowledged && (
                  <button className="btn-acknowledge">확인</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AlarmPanel




