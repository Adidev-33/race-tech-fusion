import React from 'react';

// Team Slug helper mapping local constructor ID to official F1 2026 site slug
function getTeamSlug2026(constructorId: string): string {
  const clean = constructorId.toLowerCase().replace(/[\s-]/g, '_');
  if (clean.includes('red_bull') || clean.includes('redbull')) return 'redbullracing';
  if (clean.includes('aston_martin') || clean.includes('aston')) return 'astonmartin';
  if (clean.includes('haas')) return 'haasf1team';
  if (clean.includes('racing_bulls') || clean.includes('rb') || clean.includes('visa')) return 'racingbulls';
  if (clean.includes('sauber') || clean.includes('kick') || clean.includes('audi')) return 'audi';
  return clean;
}

// Team Logos dictionary mapping constructorIds to inline SVG shapes
export function TeamLogo({ constructorId, className = 'w-6 h-6' }: { constructorId: string; className?: string }) {
  const [imgError, setImgError] = React.useState(false);
  const id = constructorId.toLowerCase().replace(/[\s-]/g, '_');

  const teamSlug = getTeamSlug2026(constructorId);

  if (teamSlug && !imgError) {
    const logoUrl = `https://media.formula1.com/image/upload/c_lfill,w_48/q_auto/v1740000001/common/f1/2026/${teamSlug}/2026${teamSlug}logowhite.webp`;
    return (
      <img 
        src={logoUrl} 
        alt={constructorId} 
        className={`${className} object-contain`} 
        onError={() => setImgError(true)} 
      />
    );
  }

  if (id.includes('red_bull')) {
    // Red Bull
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="5.5" fill="#FFD700" />
        <path d="M4 14c1.8-.8 3.2-2.2 3.6-3.6.2.8-.4 1.8-1.2 2.2C5.6 13 4.8 13.5 4 14z" fill="#E60000" />
        <path d="M20 14c-1.8-.8-3.2-2.2-3.6-3.6-.2.8.4 1.8 1.2 2.2 1 .4 1.8.9 2.4 1.4z" fill="#E60000" />
      </svg>
    );
  }

  if (id.includes('mercedes')) {
    // Mercedes
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" stroke="#E5E5E5" />
        <line x1="12" y1="12" x2="12" y2="2.2" stroke="#E5E5E5" strokeWidth="2.2" />
        <line x1="12" y1="12" x2="3.5" y2="16.9" stroke="#E5E5E5" strokeWidth="2.2" />
        <line x1="12" y1="12" x2="20.5" y2="16.9" stroke="#E5E5E5" strokeWidth="2.2" />
      </svg>
    );
  }

  if (id.includes('ferrari')) {
    // Ferrari
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C7.5 2 5.5 5 5.5 11c0 5 2.5 9 6.5 11 4-2 6.5-6 6.5-11 0-6-2-9-6.5-9z" fill="#FFEB3B" />
        <path d="M11 6.5c.2-.5.5-.5.6 0l.2.8c.1.4.3.4.4.1l.3-1.1c.1-.4.4-.3.4.1v2.5c0 .3-.3.5-.6.5h-1c-.3 0-.5-.2-.5-.5V6.5z" fill="#000000" />
        <path d="M12.5 10c0-1.5-.7-2-1.5-2s-1.5.8-1.5 2v5.5c0 .5.4.8.8.8h1.4c.5 0 .8-.3.8-.8V10z" fill="#000000" />
      </svg>
    );
  }

  if (id.includes('mclaren')) {
    // McLaren
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 18c5-2 10.5-2.5 16-10.5-2 5-6.5 7.5-16 10.5z" fill="#FF8700" />
      </svg>
    );
  }

  if (id.includes('aston_martin')) {
    // Aston Martin
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#005f3e" strokeWidth="2">
        <path d="M2 12h20M2 12c2.5-2 7-3 10 0M22 12c-2.5-2-7-3-10 0M2 12c2.5 2 7 3 10 0M22 12c-2.5 2-7 3-10 0" strokeLinecap="round" />
      </svg>
    );
  }

  if (id.includes('alpine')) {
    // Alpine
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#0090FF" strokeWidth="2.5">
        <path d="M12 3L4 20h4l4-8 4 8h4L12 3z" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="8.5" y1="13" x2="15.5" y2="13" stroke="#E6007E" strokeWidth="2" />
      </svg>
    );
  }

  if (id.includes('williams')) {
    // Williams
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#005AFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5.5l5.5 13 3.5-9 3.5 9 5.5-13" />
      </svg>
    );
  }

  if (id.includes('haas')) {
    // Haas
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#E60000" strokeWidth="2.5">
        <circle cx="12" cy="12" r="9.5" stroke="#737373" strokeWidth="1.8" />
        <path d="M8.5 7.5v9M15.5 7.5v9M8.5 12h7" strokeLinecap="round" />
      </svg>
    );
  }

  if (id.includes('sauber') || id.includes('audi')) {
    // Sauber
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#52E252" strokeWidth="2.5">
        <circle cx="12" cy="12" r="9.5" stroke="#52E252" />
        <path d="M7 11.5c1 0 1.5.5 2 1.2.5-.7 1-1.2 2-1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Fallback F1 Car Silhouette / generic logo
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 14.5l3-2h14l3 2v1h-20v-1z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="16.5" r="2" fill="currentColor" />
      <circle cx="17" cy="16.5" r="2" fill="currentColor" />
    </svg>
  );
}

// Country Flag helper component mapping nationalities & countryCodes to simplified circular SVG badges
export function CountryFlag({ nationality, countryCode, className = 'w-4.5 h-3' }: { nationality?: string; countryCode?: string; className?: string }) {
  let code = (countryCode || '').toUpperCase();
  
  if (!code && nationality) {
    const nation = nationality.toLowerCase();
    if (nation.includes('dutch') || nation.includes('nether')) code = 'NL';
    else if (nation.includes('british') || nation.includes('uk') || nation.includes('great')) code = 'GB';
    else if (nation.includes('monegasque') || nation.includes('monaco')) code = 'MC';
    else if (nation.includes('australian') || nation.includes('australia')) code = 'AU';
    else if (nation.includes('spanish') || nation.includes('spain')) code = 'ES';
    else if (nation.includes('german') || nation.includes('germany')) code = 'DE';
    else if (nation.includes('mexican') || nation.includes('mexico')) code = 'MX';
    else if (nation.includes('japanese') || nation.includes('japan')) code = 'JP';
    else if (nation.includes('canadian') || nation.includes('canada')) code = 'CA';
    else if (nation.includes('danish') || nation.includes('denmark')) code = 'DK';
    else if (nation.includes('french') || nation.includes('france')) code = 'FR';
    else if (nation.includes('finnish') || nation.includes('finland')) code = 'FI';
    else if (nation.includes('thai')) code = 'TH';
    else if (nation.includes('italian') || nation.includes('italy')) code = 'IT';
    else if (nation.includes('american') || nation.includes('us')) code = 'US';
    else if (nation.includes('austrian') || nation.includes('austria')) code = 'AT';
  }

  // Render horizontal strip flags
  if (code === 'NL') {
    // Red, White, Blue (Netherlands)
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="6.7" fill="#AE1C28" />
        <rect width="30" height="6.7" y="6.7" fill="#FFFFFF" />
        <rect width="30" height="6.7" y="13.4" fill="#21468B" />
      </svg>
    );
  }

  if (code === 'GB') {
    // UK Union Jack
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="20" fill="#012169" />
        <path d="M0 0l30 20M30 0L0 20" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="2" />
        <path d="M15 0v20M0 10h30" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3" />
      </svg>
    );
  }

  if (code === 'MC') {
    // Monaco
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="10" fill="#C8102E" />
        <rect width="30" height="10" y="10" fill="#FFFFFF" />
      </svg>
    );
  }

  if (code === 'AU') {
    // Australia
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="20" fill="#012169" />
        <circle cx="21" cy="6" r="1.2" fill="#FFFFFF" />
        <circle cx="25" cy="9" r="1" fill="#FFFFFF" />
        <circle cx="22" cy="13" r="1.2" fill="#FFFFFF" />
        <circle cx="18" cy="10" r="1" fill="#FFFFFF" />
        {/* Union jack canton simplified */}
        <rect width="14" height="9" fill="#012169" />
        <path d="M0 0l14 9M14 0L0 9" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M7 0v9M0 4.5h14" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M7 0v9M0 4.5h14" stroke="#C8102E" strokeWidth="1" />
      </svg>
    );
  }

  if (code === 'ES') {
    // Spain
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="5" fill="#C8102E" />
        <rect width="30" height="10" y="5" fill="#FFD700" />
        <rect width="30" height="5" y="15" fill="#C8102E" />
      </svg>
    );
  }

  if (code === 'DE') {
    // Germany
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="6.7" fill="#000000" />
        <rect width="30" height="6.7" y="6.7" fill="#DD0000" />
        <rect width="30" height="6.7" y="13.4" fill="#FFCE00" />
      </svg>
    );
  }

  if (code === 'MX') {
    // Mexico
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="10" height="20" fill="#11862F" />
        <rect width="10" x="10" height="20" fill="#FFFFFF" />
        <rect width="10" x="20" height="20" fill="#C8102E" />
        <circle cx="15" cy="10" r="1.5" fill="#B58110" />
      </svg>
    );
  }

  if (code === 'JP') {
    // Japan
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm border border-neutral-900/10`} viewBox="0 0 30 20">
        <rect width="30" height="20" fill="#FFFFFF" />
        <circle cx="15" cy="10" r="4.5" fill="#BC002D" />
      </svg>
    );
  }

  if (code === 'CA') {
    // Canada
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="7.5" height="20" fill="#FF0000" />
        <rect width="15" x="7.5" height="20" fill="#FFFFFF" />
        <rect width="7.5" x="22.5" height="20" fill="#FF0000" />
        <path d="M15 5.5l2 3.5h-4z" fill="#FF0000" />
      </svg>
    );
  }

  if (code === 'DK') {
    // Denmark
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="20" fill="#C8102E" />
        <rect width="30" height="3" y="8.5" fill="#FFFFFF" />
        <rect width="3" height="20" x="9" fill="#FFFFFF" />
      </svg>
    );
  }

  if (code === 'FR') {
    // France
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="10" height="20" fill="#002395" />
        <rect width="10" x="10" height="20" fill="#FFFFFF" />
        <rect width="10" x="20" height="20" fill="#ED2939" />
      </svg>
    );
  }

  if (code === 'FI') {
    // Finland
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm border border-neutral-900/10`} viewBox="0 0 30 20">
        <rect width="30" height="20" fill="#FFFFFF" />
        <rect width="30" height="4.5" y="7.5" fill="#003580" />
        <rect width="4.5" height="20" x="7.5" fill="#003580" />
      </svg>
    );
  }

  if (code === 'TH') {
    // Thailand
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="3.3" fill="#A51931" />
        <rect width="30" height="3.3" y="3.3" fill="#F4F5F8" />
        <rect width="30" height="6.8" y="6.6" fill="#2D2A4A" />
        <rect width="30" height="3.3" y="13.4" fill="#F4F5F8" />
        <rect width="30" height="3.3" y="16.7" fill="#A51931" />
      </svg>
    );
  }

  if (code === 'IT') {
    // Italy
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="10" height="20" fill="#009246" />
        <rect width="10" x="10" height="20" fill="#FFFFFF" />
        <rect width="10" x="20" height="20" fill="#CE2B37" />
      </svg>
    );
  }

  if (code === 'US') {
    // US stars and stripes
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="20" fill="#B22234" />
        <rect width="30" height="2" y="2" fill="#FFFFFF" />
        <rect width="30" height="2" y="6" fill="#FFFFFF" />
        <rect width="30" height="2" y="10" fill="#FFFFFF" />
        <rect width="30" height="2" y="14" fill="#FFFFFF" />
        <rect width="30" height="2" y="18" fill="#FFFFFF" />
        {/* blue canton */}
        <rect width="14" height="10" fill="#3C3B6E" />
        <circle cx="4" cy="3" r="0.6" fill="#FFFFFF" />
        <circle cx="8" cy="3" r="0.6" fill="#FFFFFF" />
        <circle cx="10" cy="3" r="0.6" fill="#FFFFFF" />
        <circle cx="6" cy="6" r="0.6" fill="#FFFFFF" />
        <circle cx="4" cy="8" r="0.6" fill="#FFFFFF" />
        <circle cx="8" cy="8" r="0.6" fill="#FFFFFF" />
      </svg>
    );
  }

  if (code === 'AT') {
    // Austria
    return (
      <svg className={`${className} inline-block rounded overflow-hidden shadow-sm`} viewBox="0 0 30 20">
        <rect width="30" height="6.7" fill="#ED2939" />
        <rect width="30" height="6.7" y="6.7" fill="#FFFFFF" />
        <rect width="30" height="6.7" y="13.4" fill="#ED2939" />
      </svg>
    );
  }

  // Fallback generic gray globe flag
  return (
    <svg className={`${className} inline-block rounded text-neutral-600 bg-neutral-900 border border-neutral-800`} viewBox="0 0 30 20">
      <circle cx="15" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <line x1="15" y1="4" x2="15" y2="16" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

// Driver Personal Logo Badge: Styled circular racing number with driver flag
export function DriverNumberBadge({ number, constructorId, className = 'w-7 h-7' }: { number: string; constructorId: string; className?: string }) {
  // Map team primary/secondary colors
  const colors: Record<string, { bg: string, text: string, border: string }> = {
    red_bull: { bg: 'bg-[#061D41]', text: 'text-[#FFD700]', border: 'border-[#FFD700]/20' },
    ferrari: { bg: 'bg-[#F60000]', text: 'text-white', border: 'border-white/10' },
    mclaren: { bg: 'bg-[#FF8700]', text: 'text-black', border: 'border-[#FF8700]/30' },
    mercedes: { bg: 'bg-[#00A19B]', text: 'text-white', border: 'border-[#00A19B]/30' },
    aston_martin: { bg: 'bg-[#004F30]', text: 'text-white', border: 'border-white/10' },
    alpine: { bg: 'bg-[#0090FF]', text: 'text-white', border: 'border-[#E6007E]/30' },
    williams: { bg: 'bg-[#005AFF]', text: 'text-white', border: 'border-white/10' },
    haas: { bg: 'bg-[#737373]', text: 'text-[#E60000]', border: 'border-[#E60000]/20' },
    sauber: { bg: 'bg-[#1e1e1e]', text: 'text-[#52E252]', border: 'border-[#52E252]/20' },
    racing_bulls: { bg: 'bg-[#1A33FF]', text: 'text-white', border: 'border-white/10' }
  };

  const normId = constructorId.toLowerCase();
  let colorSet = colors.mercedes;
  for (const [key, val] of Object.entries(colors)) {
    if (normId.includes(key)) {
      colorSet = val;
      break;
    }
  }

  return (
    <div className={`flex items-center justify-center rounded-full font-mono text-[10px] font-black border ${className} ${colorSet.bg} ${colorSet.text} ${colorSet.border} shadow-sm select-none`}>
      {number}
    </div>
  );
}

// Driver Profile Image Avatar Component
export function DriverAvatar({ driverId, constructorId, className = 'w-9 h-9' }: { driverId: string; constructorId: string; className?: string }) {
  const [imgError, setImgError] = React.useState(false);
  const colors: Record<string, { bg: string, border: string, fill: string }> = {
    red_bull: { bg: '#061D41', border: 'border-[#FFD700]/60', fill: '#FFD700' },
    ferrari: { bg: '#F60000', border: 'border-white/60', fill: '#FFFFFF' },
    mclaren: { bg: '#FF8700', border: 'border-[#FF8700]/60', fill: '#FF8700' },
    mercedes: { bg: '#00A19B', border: 'border-[#27F4D2]/60', fill: '#27F4D2' },
    aston_martin: { bg: '#004F30', border: 'border-white/40', fill: '#00FC87' },
    alpine: { bg: '#0090FF', border: 'border-[#E6007E]/60', fill: '#E6007E' },
    williams: { bg: '#005AFF', border: 'border-white/40', fill: '#FFFFFF' },
    haas: { bg: '#737373', border: 'border-[#E60000]/60', fill: '#E60000' },
    sauber: { bg: '#1e1e1e', border: 'border-[#52E252]/60', fill: '#52E252' },
    audi: { bg: '#1e1e1e', border: 'border-[#52E252]/60', fill: '#52E252' },
    racing_bulls: { bg: '#1A33FF', border: 'border-white/40', fill: '#FFFFFF' },
    rb: { bg: '#1A33FF', border: 'border-white/40', fill: '#FFFFFF' },
    cadillac: { bg: '#1e1e1e', border: 'border-[#FFD700]/60', fill: '#FFD700' }
  };

  const normId = constructorId.toLowerCase();
  let colorSet = colors.mercedes;
  for (const [key, val] of Object.entries(colors)) {
    if (normId.includes(key)) {
      colorSet = val;
      break;
    }
  }

  const driverShortIds: Record<string, string> = {
    albon: 'alealb01',
    alonso: 'feralo01',
    antonelli: 'andant01',
    bearman: 'olibea01',
    bortoleto: 'gabbor01',
    bottas: 'valbot01',
    colapinto: 'fracol01',
    gasly: 'piegas01',
    hadjar: 'isahad01',
    hamilton: 'lewham01',
    hulkenberg: 'nichul01',
    lawson: 'lialaw01',
    leclerc: 'chalec01',
    arvid_lindblad: 'arvlin01',
    lindblad: 'arvlin01',
    norris: 'lannor01',
    ocon: 'estoco01',
    piastri: 'oscpia01',
    perez: 'serper01',
    russell: 'georus01',
    sainz: 'carsai01',
    stroll: 'lanstr01',
    max_verstappen: 'maxver01',
    verstappen: 'maxver01'
  };

  const normDriverId = driverId.toLowerCase();
  let shortId = '';
  for (const [key, val] of Object.entries(driverShortIds)) {
    if (normDriverId.includes(key) || key.includes(normDriverId)) {
      shortId = val;
      break;
    }
  }

  const teamSlug = getTeamSlug2026(constructorId);

  const avatarUrl = (shortId && teamSlug)
    ? `https://media.formula1.com/image/upload/c_lfill,g_face,w_150,h_150/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000001/common/f1/2026/${teamSlug}/${shortId}/2026${teamSlug}${shortId}right.webp`
    : `https://robohash.org/${driverId}.png?set=set5`;

  return (
    <div className={`relative flex items-center justify-center rounded-full overflow-hidden border bg-neutral-950 ${colorSet.border} ${className} shadow-sm flex-shrink-0`}>
      {!imgError ? (
        <img 
          src={avatarUrl} 
          alt={driverId} 
          className="w-full h-full object-cover object-top"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg className="w-3/4 h-3/4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4C7.58 4 4 7.58 4 12c0 2.5.92 4.78 2.44 6.5C6.46 17.5 7.5 15.5 9 14.5c1-.7 2.2-1.1 3-1.1s2 .4 3 .9c1.5 1 2.54 3 2.56 4 1.52-1.72 2.44-4 2.44-6.5 0-4.42-3.58-8-8-8z" fill={colorSet.fill} opacity="0.95" />
          <path d="M7 11c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v1.5c0 .55-.45 1-1 1H8c-.55 0-1-.45-1-1V11z" fill="#111111" />
          <path d="M8 18c0 .5.5 1 1.5 1.2.7.2 1.5.3 2.5.3s1.8-.1 2.5-.3c1-.2 1.5-.7 1.5-1.2v-1H8v1z" fill={colorSet.fill} />
        </svg>
      )}
    </div>
  );
}

// Team Car Image component mapping constructorIds to full-width F1 car PNG renders
export function TeamCarImage({ constructorId, className = 'w-full h-auto' }: { constructorId: string; className?: string }) {
  const [imgError, setImgError] = React.useState(false);

  const teamSlug = getTeamSlug2026(constructorId);

  if (teamSlug && !imgError) {
    const carUrl = `https://media.formula1.com/image/upload/c_lfill,w_512/q_auto/d_common:f1:2026:fallback:car:2026fallbackcarright.webp/v1740000001/common/f1/2026/${teamSlug}/2026${teamSlug}carright.webp`;
    return (
      <img 
        src={carUrl} 
        alt={`${constructorId} car`} 
        className={`${className} object-contain`} 
        onError={() => setImgError(true)} 
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-neutral-900/40 rounded-lg border border-neutral-800/60 p-4 ${className}`}>
      <svg className="w-2/3 h-12 text-neutral-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 14.5l3-2h14l3 2v1h-20v-1z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="16.5" r="2" fill="currentColor" />
        <circle cx="17" cy="16.5" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}

// Driver Full Portrait Component
export function DriverPortrait({ driverId, constructorId, className = 'w-full h-auto' }: { driverId: string; constructorId: string; className?: string }) {
  const [imgError, setImgError] = React.useState(false);

  const driverShortIds: Record<string, string> = {
    albon: 'alealb01',
    alonso: 'feralo01',
    antonelli: 'andant01',
    bearman: 'olibea01',
    bortoleto: 'gabbor01',
    bottas: 'valbot01',
    colapinto: 'fracol01',
    gasly: 'piegas01',
    hadjar: 'isahad01',
    hamilton: 'lewham01',
    hulkenberg: 'nichul01',
    lawson: 'lialaw01',
    leclerc: 'chalec01',
    arvid_lindblad: 'arvlin01',
    lindblad: 'arvlin01',
    norris: 'lannor01',
    ocon: 'estoco01',
    piastri: 'oscpia01',
    perez: 'serper01',
    russell: 'georus01',
    sainz: 'carsai01',
    stroll: 'lanstr01',
    max_verstappen: 'maxver01',
    verstappen: 'maxver01'
  };

  const normDriverId = driverId.toLowerCase();
  let shortId = '';
  for (const [key, val] of Object.entries(driverShortIds)) {
    if (normDriverId.includes(key) || key.includes(normDriverId)) {
      shortId = val;
      break;
    }
  }

  const teamSlug = getTeamSlug2026(constructorId);

  // Requests the original tall standing portrait (no h_480 height crop to avoid cutting off the head)
  const portraitUrl = (shortId && teamSlug && !imgError)
    ? `https://media.formula1.com/image/upload/c_lfill,w_320/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000001/common/f1/2026/${teamSlug}/${shortId}/2026${teamSlug}${shortId}right.webp`
    : null;

  if (portraitUrl) {
    return (
      <img 
        src={portraitUrl} 
        alt={driverId} 
        className={`${className} object-contain object-top`} 
        onError={() => setImgError(true)} 
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-neutral-900/40 rounded-lg border border-neutral-800/60 p-4 ${className}`}>
      <svg className="w-1/3 h-20 text-neutral-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// Circuit Layout Map Outline Component
export function CircuitMap({ circuitId, className = 'w-full h-32' }: { circuitId: string; className?: string }) {
  const [imgError, setImgError] = React.useState(false);

  const clean = circuitId.toLowerCase().replace(/[\s-]/g, '_');
  
  const circuitSlugs: Record<string, string> = {
    albert_park: 'melbourne',
    shanghai: 'shanghai',
    suzuka: 'suzuka',
    miami: 'miami',
    villeneuve: 'montreal',
    monaco: 'montecarlo',
    catalunya: 'catalunya',
    red_bull_ring: 'spielberg',
    silverstone: 'silverstone',
    spa: 'spafrancorchamps',
    hungaroring: 'hungaroring',
    zandvoort: 'zandvoort',
    monza: 'monza',
    madring: 'madring',
    baku: 'baku',
    marina_bay: 'singapore',
    americas: 'austin',
    rodriguez: 'mexicocity',
    interlagos: 'interlagos',
    vegas: 'lasvegas',
    losail: 'lusail',
    yas_marina: 'yasmarinacircuit'
  };

  let slug = circuitSlugs[clean] || clean;

  const mapUrl = (!imgError && slug)
    ? `https://media.formula1.com/image/upload/c_lfill,w_720/v1740000001/common/f1/2026/track/2026track${slug}whiteoutline.svg`
    : null;

  if (mapUrl) {
    return (
      <img 
        src={mapUrl} 
        alt={`${circuitId} track layout`} 
        className={`${className} object-contain`} 
        onError={() => setImgError(true)} 
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-neutral-900/40 rounded-lg border border-neutral-800/60 p-4 ${className}`}>
      <svg className="w-1/2 h-full text-neutral-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}


