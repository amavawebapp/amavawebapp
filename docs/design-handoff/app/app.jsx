/* AMAVA — app shell: navigation, theme tweaks, device frame, settings. */

const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "soft",
  "accent": "#DD866C",
  "textScale": 1.0,
  "showFrame": true
}/*EDITMODE-END*/;

/* simple Settings screen (coordinator) */
function SettingsScreen({ nav }) {
  const groups = [
    { h: 'Programme set-up', rows: [
      { t: 'Programmes & classes', s: '1 programme · 3 classes', icon: 'people' },
      { t: 'Areas & indicators', s: '5 areas · 24 indicators', icon: 'spark' },
      { t: 'Rating scale', s: '1–4 · Emerging → Strong', icon: 'chart' },
    ]},
    { h: 'People', rows: [
      { t: 'Facilitator accounts', s: '6 facilitators', icon: 'people' },
    ]},
    { h: 'This phone', rows: [
      { t: 'Offline data', s: 'Everything saved · synced today', icon: 'wifi' },
    ]},
  ];
  return (
    <div className="am-screen">
      <AppBar title="Settings" onBack={() => nav.go('home')} />
      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 14, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={AMAVA.user.name} color="var(--brand)" size={56} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{AMAVA.user.name}</div>
            <div className="am-row__sub" style={{ textTransform: 'capitalize' }}>{AMAVA.user.role}</div>
          </div>
        </div>
        {groups.map(g => (
          <div key={g.h}>
            <div className="am-sectionlab"><span className="am-eyebrow">{g.h}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {g.rows.map(r => (
                <div key={r.t} className="am-row" style={{ cursor: 'pointer' }}>
                  <div className="am-ava" style={{ width: 40, height: 40, flexBasis: 40, borderRadius: 12, background: 'var(--surface-2)' }}>
                    <Icon name={r.icon} size={20} color="var(--brand)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="am-row__title" style={{ fontSize: '1rem' }}>{r.t}</div>
                    <div className="am-row__sub">{r.s}</div>
                  </div>
                  <Icon name="chevron" size={20} color="var(--sage)" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="am-btn am-btn--ghost am-btn--block" style={{ marginTop: 6, color: 'var(--warn)', borderColor: 'var(--line)' }} onClick={() => nav.go('login')}>
          <Icon name="logout" size={20} /> Sign out
        </button>
      </div>
      <BottomNav nav={nav} active="settings" />
    </div>
  );
}

const SCREENS = {
  login: LoginScreen,
  home: HomeScreen,
  class: ChildListScreen,
  assess: AssessScreen,
  reports: ReportsScreen,
  settings: SettingsScreen,
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useStateA({ name: 'login', params: {} });
  const [toast, setToast] = useStateA(null);

  const nav = {
    go(name, params = {}) {
      if (params.saved) setToast(`Saved — ${params.saved}'s assessment`);
      setRoute({ name, params });
    },
  };

  useEffectA(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const Screen = SCREENS[route.name] || LoginScreen;
  const rootStyle = { '--fs-user': t.textScale, '--accent': t.accent };

  return (
    <div className="am-root" data-theme={t.direction} style={rootStyle}>
      {route.name === 'paper' ? (
        <div style={{ position: 'fixed', inset: 0 }}>
          <PaperReport scope={route.params.scope || { kind: 'org' }} onBack={() => nav.go('reports', { scope: route.params.scope })} />
        </div>
      ) : (
        <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center',
          background: 'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--brand) 12%, var(--bg-2)) 0%, var(--bg-2) 60%)',
          overflow: 'auto', padding: 20 }}>
          <div style={{ position: 'relative' }}>
            {t.showFrame ? (
              <IOSDevice>
                <div style={{ height: '100%' }} key={route.name + JSON.stringify(route.params)}>
                  <Screen nav={nav} params={route.params} />
                </div>
              </IOSDevice>
            ) : (
              <div style={{ width: 402, height: 874, borderRadius: 28, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', background: 'var(--bg)' }}
                key={route.name + JSON.stringify(route.params)}>
                <Screen nav={nav} params={route.params} />
              </div>
            )}
            <Toast show={!!toast}>{toast}</Toast>
          </div>
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Visual direction" />
        <TweakRadio label="Style" value={t.direction}
          options={[{ value: 'soft', label: 'Soft' }, { value: 'garden', label: 'Garden' }, { value: 'simple', label: 'Simple' }]}
          onChange={v => setTweak('direction', v)} />
        <p style={{ fontSize: 12, color: '#8a857c', margin: '2px 4px 0', lineHeight: 1.4 }}>
          {t.direction === 'soft' && 'Warm cream, rounded cards — friendly & calm.'}
          {t.direction === 'garden' && 'Greener, more organic — leans into the garden theme.'}
          {t.direction === 'simple' && 'High contrast, bigger touch targets — easiest to read.'}
        </p>
        <TweakSection label="Colour & size" />
        <TweakColor label="Accent" value={t.accent}
          options={['#DD866C', '#687F8B', '#6fa173', '#c9a24a']}
          onChange={v => setTweak('accent', v)} />
        <TweakSlider label="Text size" value={t.textScale} min={0.9} max={1.35} step={0.05} unit="×"
          onChange={v => setTweak('textScale', v)} />
        <TweakSection label="Presentation" />
        <TweakToggle label="Show phone frame" value={t.showFrame} onChange={v => setTweak('showFrame', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
