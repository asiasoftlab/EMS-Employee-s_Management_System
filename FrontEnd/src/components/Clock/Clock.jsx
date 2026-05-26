import { useState, useEffect } from 'react';
import './Clock.css';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Work shift: 9:30 AM to 5:30 PM
  const nowInSeconds = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
  const startSeconds = 9.5 * 3600; // 9:30 AM
  const endSeconds = 17.5 * 3600; // 5:30 PM
  const totalShiftSeconds = endSeconds - startSeconds;
  
  let shiftProgress = ((nowInSeconds - startSeconds) / totalShiftSeconds) * 100;
  shiftProgress = Math.max(0, Math.min(100, shiftProgress));

  return (
    <div className="navbar-clock-container">
      <div className={`navbar-clock ${showDetails ? 'active' : ''}`} onClick={() => setShowDetails(!showDetails)}>
        <div className="clock-time">{formatTime(time)}</div>
        <div className="clock-date">
          {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {showDetails && (
        <>
          <div className="clock-details-overlay" onClick={() => setShowDetails(false)} />
          <div className="clock-details-panel">
            <div className="details-header">
              <h3>System Timeline</h3>
              <button onClick={() => setShowDetails(false)}>&times;</button>
            </div>
            
            <div className="details-content">
              <div className="full-date-display">{formatDate(time)}</div>
              
              <div className="progress-section">
                <div className="section-label">Work Shift Progress</div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${shiftProgress}%` }} />
                </div>
                <div className="progress-markers">
                  <span>9:30 AM</span>
                  <span>5:30 PM</span>
                </div>
                <div className="section-value">
                  {shiftProgress === 0 ? 'Shift hasn\'t started' : 
                   shiftProgress === 100 ? 'Shift completed' : 
                   `${shiftProgress.toFixed(1)}% Completed`}
                </div>
              </div>

              <div className="mini-calendar">
                {/* Simplified Calendar Placeholder */}
                <div className="calendar-grid">
                  {['S','M','T','W','T','F','S'].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
                  {Array.from({length: 31}, (_, i) => (
                    <div key={i} className={`calendar-day ${i + 1 === time.getDate() ? 'today' : ''}`}>
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="details-footer">
              EMS Timeline v1.0 • Stable Connection
            </div>
          </div>
        </>
      )}
    </div>
  );
}
