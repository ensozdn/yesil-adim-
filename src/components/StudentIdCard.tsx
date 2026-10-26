import React from 'react';
import type { StudentProfile } from '../types';
import { Icon } from './Icon';

interface StudentIdCardProps {
  profile: StudentProfile;
  stars: number;
  levelName: string;
  levelNumber: number;
}

export const StudentIdCard: React.FC<StudentIdCardProps> = ({
  profile,
  stars,
  levelName,
  levelNumber
}) => {
  const displayName = profile.fullName.trim() || 'Öğrenci Adı Soyadı';
  const displayId = profile.studentId.trim() || 'Öğrenci No Belirtilmedi';
  const displayDept = profile.department.trim() || 'Sakarya Üniversitesi';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="id-card-wrapper">
      <div className="student-id-card">
        <div className="id-card-bg-circle" />
        <div className="id-card-header">
          <div className="id-card-brand">
            <div className="id-brand-mark">
              <Icon name="leaf" size={15} />
            </div>
            <div>
              <div className="id-uni-title">SAKARYA ÜNİVERSİTESİ</div>
              <div className="id-uni-subtitle">Sürdürülebilir Kampüs Kimliği</div>
            </div>
          </div>
          <div className="id-level-pill">
            <Icon name="spark" size={13} />
            <span>Seviye {levelNumber}</span>
          </div>
        </div>

        <div className="id-card-body">
          <div className="id-avatar-box">
            <span className="id-initials">{initials || 'SAÜ'}</span>
          </div>
          <div className="id-meta-box">
            <div className="id-student-name">{displayName}</div>
            <div className="id-student-no">{displayId}</div>
            <div className="id-student-dept">{displayDept}</div>
          </div>
        </div>

        <div className="id-card-footer">
          <div className="id-footer-left">
            <span className="id-status-badge">Doğrulanmış Kampüs Cüzdanı</span>
            <div className="id-balance-tag">{stars} Yıldız Bakiyesi · {levelName}</div>
          </div>
          <div className="id-barcode-graphic">
            <svg
              width="60"
              height="24"
              viewBox="0 0 60 24"
              fill="none"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="2" height="20" fill="white" opacity="0.8" />
              <rect x="6" y="2" width="3" height="20" fill="white" opacity="0.8" />
              <rect x="11" y="2" width="1" height="20" fill="white" opacity="0.8" />
              <rect x="14" y="2" width="4" height="20" fill="white" opacity="0.8" />
              <rect x="20" y="2" width="2" height="20" fill="white" opacity="0.8" />
              <rect x="24" y="2" width="1" height="20" fill="white" opacity="0.8" />
              <rect x="27" y="2" width="3" height="20" fill="white" opacity="0.8" />
              <rect x="32" y="2" width="2" height="20" fill="white" opacity="0.8" />
              <rect x="36" y="2" width="4" height="20" fill="white" opacity="0.8" />
              <rect x="42" y="2" width="1" height="20" fill="white" opacity="0.8" />
              <rect x="45" y="2" width="3" height="20" fill="white" opacity="0.8" />
              <rect x="50" y="2" width="2" height="20" fill="white" opacity="0.8" />
              <rect x="54" y="2" width="4" height="20" fill="white" opacity="0.8" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentIdCard;
