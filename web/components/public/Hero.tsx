export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <div className="hero">
      <div className="brand">
        <svg width="26" height="38" viewBox="0 0 26 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 37 L13 9" stroke="#C98A3C" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M13 6 C13 6 11.8 3.2 13 1 C14.2 3.2 13 6 13 6 Z" fill="#C98A3C" />
          <g fill="#C98A3C">
            <ellipse cx="9.6" cy="10.5" rx="2" ry="4.2" transform="rotate(-32 9.6 10.5)" />
            <ellipse cx="16.4" cy="10.5" rx="2" ry="4.2" transform="rotate(32 16.4 10.5)" />
            <ellipse cx="8.9" cy="16.5" rx="2.15" ry="4.5" transform="rotate(-30 8.9 16.5)" />
            <ellipse cx="17.1" cy="16.5" rx="2.15" ry="4.5" transform="rotate(30 17.1 16.5)" />
            <ellipse cx="8.2" cy="23" rx="2.3" ry="4.8" transform="rotate(-28 8.2 23)" />
            <ellipse cx="17.8" cy="23" rx="2.3" ry="4.8" transform="rotate(28 17.8 23)" />
            <ellipse cx="7.6" cy="30" rx="2.45" ry="5.1" transform="rotate(-26 7.6 30)" />
            <ellipse cx="18.4" cy="30" rx="2.45" ry="5.1" transform="rotate(26 18.4 30)" />
          </g>
        </svg>
        <div>
          <div className="brand-name">Sarah</div>
          <div className="brand-sub">Pães Artesanais</div>
        </div>
      </div>
      <div className="hero-title">Pães de Fermentação Natural</div>
      <p className="hero-desc">
        Focaccias, pães italianos, pães de batata e outras receitas artesanais, feitas com fermentação natural.
      </p>
      {children}
    </div>
  );
}
