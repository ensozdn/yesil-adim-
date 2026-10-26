import React from 'react';
import type { FacultyStanding } from '../types';
import { Icon } from './Icon';

interface FacultyLeaderboardProps {
  standings: FacultyStanding[];
}

export const FacultyLeaderboard: React.FC<FacultyLeaderboardProps> = ({ standings }) => {
  const maxStars = standings.length > 0 ? standings[0].stars : 1;
  const userFaculty = standings.find((s) => s.isUserFaculty);

  return (
    <div className="leaderboard-container">
      <div className="sectionhead">
        <strong>Fakülteler Arası Sıralama</strong>
        <span className="small">SAÜ Yeşil Kampüs Ligi</span>
      </div>

      {userFaculty && (
        <div className="user-faculty-highlight-bar">
          <div className="taskicon sm-icon">
            <Icon name="trophy" size={18} />
          </div>
          <div className="taskmeta">
            <strong>{userFaculty.name}</strong>
            <span>Fakülten {userFaculty.rank}. sırada · Katkın doğrudan puanına ekleniyor</span>
          </div>
          <span className="taskxp">{userFaculty.stars} Yıldız</span>
        </div>
      )}

      <div className="leaderboard-list">
        {standings.map((item) => {
          const percent = Math.min(100, Math.round((item.stars / maxStars) * 100));
          return (
            <div
              key={item.id}
              className={`leaderboard-row ${item.isUserFaculty ? 'user-active-faculty' : ''}`}
            >
              <div className={`rank-badge rank-${item.rank}`}>
                {item.rank}
              </div>

              <div className="leaderboard-meta">
                <div className="leaderboard-title-row">
                  <strong className="faculty-name">{item.name}</strong>
                  {item.isUserFaculty && (
                    <span className="user-faculty-tag">Fakülten</span>
                  )}
                </div>

                <div className="leaderboard-track">
                  <div
                    className="leaderboard-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="leaderboard-subline">
                  <span>{item.recycledCount} atık dönüştürüldü</span>
                  <span className="leaderboard-stars-val">{item.stars} Yıldız</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FacultyLeaderboard;
