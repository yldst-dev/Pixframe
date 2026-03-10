interface PfLoaderProps {
  className?: string;
}

const PfLoader = ({ className }: PfLoaderProps) => (
  <div className={`pf-loader ${className || ''}`}>
    <div className="pf-face" />
    <div className="pf-face" />
    <div className="pf-face" />
    <div className="pf-face" />
  </div>
);

export default PfLoader;
