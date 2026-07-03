import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import '../styles/error-pages.css';

function BackgroundOrbs({ forbidden = false }) {
  return (
    <>
      <div className={`error-page-orb error-page-orb-1 ${forbidden ? 'error-page-orb-forbidden' : ''}`} />
      <div className={`error-page-orb error-page-orb-2 ${forbidden ? 'error-page-orb-forbidden' : ''}`} />
      <div className={`error-page-orb error-page-orb-3 ${forbidden ? 'error-page-orb-forbidden' : ''}`} />
      <div className="error-particles">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="error-particle" />
        ))}
      </div>
    </>
  );
}

function CodeDisplay({ code, forbidden = false }) {
  const digits = String(code).split('');
  return (
    <div className={`error-code ${forbidden ? 'error-code-forbidden' : ''}`}>
      {digits.map((d, i) => (
        <span key={i} className="error-digit">{d}</span>
      ))}
    </div>
  );
}

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const homeTo = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className="error-page-root">
      <BackgroundOrbs />
      <div className="error-page-content">

        <div className="error-page-card">
          <div className="error-illustration-wrap">
            <div className="error-face-frame">
              <div className="error-scan-line" />
              <div className="error-face-icon">
                <span className="error-eye error-eye-left" />
                <span className="error-eye error-eye-right" />
                <span className="error-mouth" />
              </div>
            </div>
          </div>

          <CodeDisplay code={404} />

          <h1 className="text-xl font-semibold text-[var(--text-h)] m-0 error-stagger-1">
            Trang không tồn tại
          </h1>

          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6 error-stagger-3">
            <Link to={homeTo} className="btn-primary-soft px-5 py-2.5 text-sm font-medium no-underline inline-block">
              {isAuthenticated ? 'Về tổng quan' : 'Về đăng nhập'}
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn-ghost px-5 py-2.5 text-sm font-medium"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  const { isAuthenticated } = useAuth();
  const homeTo = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className="error-page-root">
      <BackgroundOrbs forbidden />
      <div className="error-page-content">
        <div className="error-page-card">
          <div className="error-illustration-wrap">
            <div className="error-face-frame error-face-frame-forbidden">
              <div className="error-lock-ring" />
              <div className="error-scan-line error-scan-line-forbidden" />
              <div className="error-face-icon">
                <svg className="error-lock-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>

          <CodeDisplay code={403} forbidden />

          <h1 className="text-xl font-semibold text-[var(--text-h)] m-0 error-stagger-1">
            Không có quyền truy cập
          </h1>

          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6 error-stagger-3">
            <Link to={homeTo} className="btn-primary-soft px-5 py-2.5 text-sm font-medium no-underline inline-block">
              {isAuthenticated ? 'Về tổng quan' : 'Về đăng nhập'}
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn-ghost px-5 py-2.5 text-sm font-medium"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
