import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store';

const Loading = () => {
  const { t } = useTranslation();
  const { loading, loadingProgress } = useStore();

  const { current, total, currentFileName } = loadingProgress;
  const safeTotal = total > 0 ? total : 0;
  const safeCurrent = safeTotal > 0 ? Math.min(Math.max(current, 0), safeTotal) : 0;
  const hasProgress = safeTotal > 0;

  return (
    <div
      aria-hidden={!loading}
      className={
        `fixed inset-0 z-[200] flex items-center justify-center ` +
        `transition-opacity duration-200 ease-out ` +
        (loading ? 'opacity-100 pointer-events-auto bg-background/75 backdrop-blur-md' : 'opacity-0 pointer-events-none')
      }
    >
      <div
        className={
          `bg-card border border-border shadow-2xl p-8 max-w-xs w-full ` +
          `transition-all duration-200 ease-out ` +
          (loading ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95')
        }
      >
        <div className="flex justify-center mb-6 text-primary">
          <div className="pf-square-loader" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-base font-bold uppercase tracking-tight">
            {t('root.processing', '처리 중...')}
          </h3>

          {hasProgress ? (
            <p className="text-sm font-mono text-muted-foreground">
              {safeCurrent} / {safeTotal}
            </p>
          ) : (
            <p className="text-sm font-mono text-muted-foreground">...</p>
          )}

          {currentFileName ? (
            <p className="text-xs text-muted-foreground/70 truncate max-w-full px-2">
              {currentFileName}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/70">
              {t('root.heif-processing', 'HEIC/HEIF 파일은 변환 시간이 더 걸릴 수 있습니다')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Loading;
