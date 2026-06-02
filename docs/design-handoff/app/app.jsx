/* AMAVA — app shell: navigation, theme tweaks, device frame, settings. */

const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "soft",
  "accent": "#DD866C",
  "textScale": 1.0,
  "showFrame": true
}/*EDITMODE-END*/;

const SCREENS = {
  login: LoginScreen,
  home: HomeScreen,
  class: ChildListScreen,
  assess: AssessScreen,
  reports: ReportsScreen,
  settings: SettingsScreen,
  'settings-programmes': SettingsProgrammes,
  'settings-areas': SettingsAreas,
  'settings-scale': SettingsScale,
  'settings-facilitators': SettingsFacilitators,
  'settings-offline': SettingsOffline,
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
    toast(msg) { setToast(msg); },
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
                  <Screen nav={nav} params={route.params} t={t} setTweak={setTweak} />
                </div>
              </IOSDevice>
            ) : (
              <div style={{ width: 402, height: 874, borderRadius: 28, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', background: 'var(--bg)' }}
                key={route.name + JSON.stringify(route.params)}>
                <Screen nav={nav} params={route.params} t={t} setTweak={setTweak} />
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
