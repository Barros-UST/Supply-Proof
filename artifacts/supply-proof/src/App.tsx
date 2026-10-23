import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import {
  AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Check,
  ClipboardList, Copy, FileCheck2, FileText, ImagePlus, LayoutDashboard, ListFilter,
  MessageSquareText, PackageCheck, Plus, Search, Settings as SettingsIcon, ShieldCheck,
  Upload, X,
} from 'lucide-react';

type Status = 'Open' | 'Awaiting response' | 'Disputed' | 'Resolved';
type EvidenceFile = { name: string; size: string; kind: 'receipt' | 'photo' | 'other' };
type CaseRecord = {
  id: string; supplier: string; branch: string; po: string; date: string; item: string; unit: string;
  ordered: number; received: number; issue: string; unitCost: number; currency?: string; notes: string; status: Status;
  files: EvidenceFile[]; timeline: { title: string; date: string; detail: string }[]; recovered: number;
};
type Settings = {
  businessName: string; branch: string; email: string; currency: string;
  notifications: { created: boolean; status: boolean; recovery: boolean };
};

const initialCases: CaseRecord[] = [
  {
    id: 'SP-1048', supplier: 'Northline Food Supplies', branch: 'Manila Branch', po: 'KN-10482',
    date: '23 Oct 2026', item: 'Full cream milk', unit: '6 × 1L case', ordered: 50, received: 42,
    issue: 'Short delivery', unitCost: 750,
    notes: 'Our receiving staff verified the count against the PO and signed delivery receipt. Supporting documents are available for your review.',
    status: 'Open', files: [
      { name: 'delivery-receipt.pdf', size: '248 KB', kind: 'receipt' },
      { name: 'receiving-count.jpg', size: '1.8 MB', kind: 'photo' },
    ],
    timeline: [
      { title: 'Case created', date: '23 Oct 2026 · 09:12 · Mika Santos', detail: 'Purchase order and quantities verified by Mika Santos.' },
      { title: 'Receiving count verified', date: '23 Oct 2026 · 09:14 · Mika Santos', detail: '50 ordered, 42 received. Shortfall of 8 cases.' },
      { title: 'Evidence attached', date: '23 Oct 2026 · 09:18 · Mika Santos', detail: 'Delivery receipt and receiving count photo added.' },
    ], recovered: 0,
  },
  { id: 'SP-1047', supplier: 'FreshRoute Distributors', branch: 'Quezon City Branch', po: 'KN-10479', date: '22 Oct 2026', item: 'Fresh tomato crates', unit: 'crate', ordered: 18, received: 16, issue: 'Short delivery', unitCost: 625, notes: 'Receiving staff checked the count against the PO.', status: 'Awaiting response', files: [], timeline: [{ title: 'Case created', date: '22 Oct 2026 · 14:28 · Mika Santos', detail: 'Short delivery recorded.' }], recovered: 0 },
  { id: 'SP-1046', supplier: 'Luntian Dairy Supply', branch: 'Manila Branch', po: 'KN-10474', date: '22 Oct 2026', item: 'Full cream milk', unit: '6 × 1L case', ordered: 30, received: 27, issue: 'Damaged goods', unitCost: 800, notes: 'Three cases arrived with damaged packaging.', status: 'Open', files: [], timeline: [{ title: 'Case created', date: '22 Oct 2026 · 11:06 · Mika Santos', detail: 'Damaged goods recorded.' }], recovered: 0 },
  { id: 'SP-1045', supplier: 'Northline Food Supplies', branch: 'Cebu Branch', po: 'KN-10468', date: '21 Oct 2026', item: 'Paper cups', unit: '1,000 pcs', ordered: 10, received: 9, issue: 'Wrong item', unitCost: 1800, notes: 'One carton contained the wrong size.', status: 'Awaiting response', files: [], timeline: [{ title: 'Case created', date: '21 Oct 2026 · 16:42 · Mika Santos', detail: 'Wrong item recorded.' }], recovered: 0 },
  { id: 'SP-1044', supplier: 'Umaga Bread Supply', branch: 'Quezon City Branch', po: 'KN-10463', date: '21 Oct 2026', item: 'Pandesal', unit: '100-piece tray', ordered: 24, received: 22, issue: 'Quality issue', unitCost: 450, notes: 'Two trays did not meet the expected quality.', status: 'Open', files: [], timeline: [{ title: 'Case created', date: '21 Oct 2026 · 08:40 · Mika Santos', detail: 'Quality concern documented.' }], recovered: 0 },
  { id: 'SP-1043', supplier: 'FreshRoute Distributors', branch: 'Cebu Branch', po: 'KN-10458', date: '20 Oct 2026', item: 'Local banana crates', unit: 'crate', ordered: 14, received: 13, issue: 'Damaged goods', unitCost: 1250, notes: 'One crate was damaged on arrival.', status: 'Resolved', files: [], timeline: [{ title: 'Case resolved', date: '21 Oct 2026 · 10:06 · Mika Santos', detail: 'Supplier credit recorded.' }], recovered: 1250 },
];
const initialSettings: Settings = {
  businessName: 'Kape Norte Café', branch: 'Manila Branch', email: 'mika@kapenorte.example',
  currency: 'PHP', notifications: { created: true, status: true, recovery: false },
};
const caseStorage = 'supplyproof-cases-v1';
const settingsStorage = 'supplyproof-settings-v1';
const getCases = (): CaseRecord[] => {
  try { const raw = localStorage.getItem(caseStorage); return raw ? JSON.parse(raw) as CaseRecord[] : initialCases; }
  catch { return initialCases; }
};
const getSettings = (): Settings => {
  try { const raw = localStorage.getItem(settingsStorage); return raw ? JSON.parse(raw) as Settings : initialSettings; }
  catch { return initialSettings; }
};
const money = (amount: number, currency = 'PHP') => new Intl.NumberFormat('en-PH', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
const shortDate = () => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

function App() {
  const [cases, setCases] = useState<CaseRecord[]>(getCases);
  const [settings, setSettings] = useState<Settings>(getSettings);
  const [flash, setFlash] = useState('');
  const [location, setLocation] = useLocation();
  useEffect(() => localStorage.setItem(caseStorage, JSON.stringify(cases)), [cases]);
  useEffect(() => localStorage.setItem(settingsStorage, JSON.stringify(settings)), [settings]);
  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(''), 2600);
    return () => window.clearTimeout(timer);
  }, [flash]);
  const updateCase = (id: string, change: Partial<CaseRecord>, event?: string) => {
    setCases((current) => current.map((item) => {
      if (item.id !== id) return item;
      const now = `${shortDate()} · ${new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date())} · Mika Santos`;
      const timeline = event ? [...item.timeline, { title: event, date: now, detail: event === 'Recovery recorded' ? `Recorded recovery of ${money(change.recovered ?? 0, settings.currency)}.` : `Status updated to ${change.status ?? item.status}.` }] : item.timeline;
      return { ...item, ...change, timeline };
    }));
  };
  const createCase = (record: Omit<CaseRecord, 'id' | 'timeline' | 'recovered'>) => {
    const numeric = Math.max(...cases.map((item) => Number(item.id.slice(3))), 1048) + 1;
    const id = `SP-${numeric}`;
    const item: CaseRecord = { ...record, id, recovered: 0, timeline: [{ title: 'Case created', date: `${record.date} · ${new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date())} · Mika Santos`, detail: 'Discrepancy recorded and quantities verified.' }] };
    setCases((current) => [item, ...current]);
    setFlash(`${id} added to your discrepancies`);
    setLocation(`/cases/${id}`);
  };
  const saveSettings = (next: Settings) => { setSettings(next); setFlash('Workspace defaults saved'); };

  const isAuth = ['/login', '/signup'].includes(location);
  if (isAuth) return <><Switch>
    <Route path="/login"><AuthPage signup={false} settings={settings} onDone={() => setLocation('/')} onFlash={setFlash} /></Route>
    <Route path="/signup"><AuthPage signup settings={settings} onDone={() => setLocation('/')} onFlash={setFlash} /></Route>
  </Switch>{flash && <div className="flash" role="status">{flash}</div>}</>;

  return <div className="app-shell">
    <Shell location={location} settings={settings}>
      <Switch>
        <Route path="/"><Welcome settings={settings} /></Route>
        <Route path="/overview"><Dashboard cases={cases} settings={settings} /></Route>
        <Route path="/discrepancies"><Discrepancies cases={cases} settings={settings} /></Route>
        <Route path="/cases/new"><NewCase settings={settings} onCreate={createCase} /></Route>
        <Route path="/cases/:id/message"><MessagePage cases={cases} settings={settings} onFlash={setFlash} /></Route>
        <Route path="/cases/:id"><CaseDetail cases={cases} settings={settings} onUpdate={updateCase} /></Route>
        <Route path="/settings"><SettingsPage settings={settings} onSave={saveSettings} /></Route>
        <Route><NotFound /></Route>
      </Switch>
    </Shell>
    {flash && <div className="flash" role="status" data-testid="status-toast">{flash}</div>}
  </div>;
}

function Shell({ children, location, settings }: { children: ReactNode; location: string; settings: Settings }) {
  const nav = [
    { href: '/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/discrepancies', label: 'Discrepancies', icon: ClipboardList },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ];
  const active = (href: string) => href === '/overview' ? ['/','/overview'].includes(location) : location === href || location.startsWith(`${href}/`);
  return <>
    <header className="topbar">
      <Link href="/" className="brand" data-testid="link-brand"><img src="/assets/supplyproof-mark.png" alt="Supply Proof mark" /><span>Supply Proof<small>{settings.businessName}</small></span></Link>
      <div className="top-actions"><div className="avatar" aria-label="Mika Santos">MS</div><Link href="/settings" className="icon-btn" aria-label="Open settings" data-testid="link-settings-header"><SettingsIcon size={18} /></Link></div>
    </header>
    <div className="layout">
      <aside className="sidebar">
        <div><div className="workspace-label">Workspace</div><nav className="nav-list" aria-label="Main navigation">{nav.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={`nav-link${active(href) ? ' active' : ''}`} data-testid={`nav-${label.toLowerCase()}`}><Icon size={17} strokeWidth={1.8} />{label}</Link>)}</nav></div>
        <Link href="/cases/new" className="btn btn-primary full-width" data-testid="button-new-discrepancy"><Plus size={16} />New discrepancy</Link>
        <div className="sidebar-note"><strong><ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Proof that travels with the case</strong>Keep a clear record of every delivery issue, from receiving count to supplier resolution.</div>
        <div style={{ color: '#889691', fontSize: 10, padding: '0 10px' }}>SAMPLE WORKSPACE · PHILIPPINES</div>
      </aside>
      <main className="main"><div className="content">{children}</div></main>
    </div>
    <nav className="bottom-nav" aria-label="Mobile navigation">{nav.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={active(href) ? 'active' : ''} data-testid={`mobile-nav-${label.toLowerCase()}`}><Icon size={18} />{label}</Link>)}</nav>
  </>;
}

function Welcome({ settings }: { settings: Settings }) {
  return <div className="welcome-page">
    <div className="page-head"><div><div className="eyebrow">Good morning, Mika</div><h1>Welcome back</h1><p className="subtitle">Document delivery issues. Recover what’s owed.</p></div><Link href="/cases/new" className="btn btn-primary" data-testid="button-new-case-welcome"><Plus size={16} />New discrepancy</Link></div>
    <div className="panel panel-pad" style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 28, alignItems: 'center', padding: 30, overflow: 'hidden', background: 'linear-gradient(112deg,#fff 0%,#fff 58%,#edf7f1 100%)' }}>
      <div><div className="eyebrow">Your receiving record, in one place</div><h2 style={{ font: '800 32px/1.16 var(--app-font-serif)', letterSpacing: '-.04em', margin: '12px 0 11px', maxWidth: 500 }}>Make every delivery count.</h2><p className="subtitle" style={{ maxWidth: 460, marginBottom: 22 }}>Capture what arrived, keep the proof together, and prepare a clear follow-up when something is off.</p><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link href="/overview" className="btn btn-primary" data-testid="button-open-overview">Open workspace <ArrowRight size={15} /></Link><Link href="/discrepancies" className="btn btn-secondary" data-testid="button-browse-cases">Browse cases</Link></div></div>
      <div style={{ textAlign: 'center', position: 'relative' }}><img src="/assets/supplyproof-welcome.png" alt="Supply Proof verified delivery box illustration" style={{ width: 'min(100%,270px)', borderRadius: 22, mixBlendMode: 'multiply' }} /></div>
    </div>
    <div className="stats" style={{ marginTop: 18 }}>
      <div className="panel stat"><div className="stat-top">Open cases <ClipboardList size={16} color="#087e83" /></div><div className="stat-num">18</div><div className="stat-foot">Across all branches</div></div>
      <div className="panel stat"><div className="stat-top">Disputed value <AlertCircle size={16} color="#b87d27" /></div><div className="stat-num">₱78,750</div><div className="stat-foot">Across 18 open cases</div></div>
      <div className="panel stat"><div className="stat-top">Recovered this month <BadgeCheck size={16} color="#318260" /></div><div className="stat-num">₱18,750</div><div className="stat-foot">7 recorded recoveries</div></div>
    </div>
    <section className="panel panel-pad">
      <div className="section-title"><div><h2>Start with a delivery</h2><p>Everything you need to document one issue clearly.</p></div><span className="status status-open">Sample workspace</span></div>
      <div className="detail-grid" style={{ gap: 10 }}>
        {[['01','Record the count','Compare ordered and received quantities.'],['02','Attach the proof','Keep receipts and receiving photos with the case.'],['03','Prepare a follow-up','Review a ready-to-copy message before sharing it yourself.']].map(([n,title,desc]) => <div key={n} style={{ padding: 13, background: '#f7faf7', borderRadius: 10, display: 'flex', gap: 12 }}><span className="case-id">{n}</span><div><strong style={{ display:'block', fontSize:12, marginBottom:3 }}>{title}</strong><small style={{ color:'#738581', lineHeight:1.45 }}>{desc}</small></div></div>)}
      </div>
    </section>
  </div>;
}

function Dashboard({ cases, settings }: { cases: CaseRecord[]; settings: Settings }) {
  const openCount = cases.filter((item) => item.status !== 'Resolved').length;
  const disputed = cases.filter((item) => item.status !== 'Resolved').reduce((sum, item) => sum + Math.max(0, item.ordered - item.received) * item.unitCost, 0);
  const recovered = cases.reduce((sum, item) => sum + item.recovered, 0);
  return <><div className="page-head"><div><div className="eyebrow">23 Oct 2026 · {settings.businessName}</div><h1>Overview</h1><p className="subtitle">A clear view of what’s still waiting for a response.</p></div><Link href="/cases/new" className="btn btn-primary" data-testid="button-new-case-dashboard"><Plus size={16} />New discrepancy</Link></div>
    <div className="stats">
      <div className="panel stat"><div className="stat-top">Open cases <ClipboardList size={16} color="#087e83" /></div><div className="stat-num" data-testid="metric-open-cases">{Math.max(18, openCount)}</div><div className="stat-foot">Across all branches</div></div>
      <div className="panel stat"><div className="stat-top">Disputed value <AlertCircle size={16} color="#b87d27" /></div><div className="stat-num" data-testid="metric-disputed-value">{money(Math.max(78750, disputed), settings.currency)}</div><div className="stat-foot">Across open cases</div></div>
      <div className="panel stat"><div className="stat-top">Recorded recoveries <BadgeCheck size={16} color="#318260" /></div><div className="stat-num" data-testid="metric-recoveries">{money(Math.max(18750, recovered), settings.currency)}</div><div className="stat-foot">This month · {settings.currency}</div></div>
    </div>
    <section className="panel">
      <div className="panel-pad section-title"><div><h2>Recent discrepancies</h2><p>Latest cases across your workspace.</p></div><Link href="/discrepancies" className="btn btn-secondary btn-sm" data-testid="link-view-all-cases">View all discrepancies <ArrowRight size={14} /></Link></div>
      <CaseTable cases={cases.slice(0, 5)} settings={settings} />
    </section>
    <div className="two-col" style={{ marginTop: 17 }}>
      <section className="panel panel-pad"><div className="section-title"><div><h2>Follow-ups in progress</h2><p>Cases with a supplier response pending.</p></div><MessageSquareText size={17} color="#087e83" /></div>
        {cases.filter((item) => item.status === 'Awaiting response').slice(0,2).map((item) => <Link key={item.id} href={`/cases/${item.id}`} className="file-row" data-testid={`card-followup-${item.id}`}><div><strong className="case-name">{item.supplier}</strong><small className="case-sub">{item.id} · {item.item}</small></div><span className="status status-awaiting">Awaiting response</span></Link>)}
        {!cases.some((item) => item.status === 'Awaiting response') && <p className="subtitle">No supplier responses pending.</p>}
      </section>
      <section className="panel panel-pad"><div className="section-title"><div><h2>Proof checklist</h2><p>Keep the essentials with every case.</p></div><FileCheck2 size={17} color="#087e83" /></div>
        <div className="check-row"><div className="check-icon"><Check size={14} /></div><div><strong>Signed delivery receipt</strong><small>Confirms what was accepted at the branch.</small></div></div>
        <div className="check-row"><div className="check-icon"><ImagePlus size={14} /></div><div><strong>Receiving count photo</strong><small>A clear record of the delivered boxes.</small></div></div>
      </section>
    </div>
  </>;
}

function CaseTable({ cases, settings }: { cases: CaseRecord[]; settings: Settings }) {
  if (!cases.length) return <div className="empty-state"><PackageCheck size={28} color="#84aaa1" /><strong>No discrepancies yet</strong><p>Your delivery records will appear here.</p><Link href="/cases/new" className="btn btn-primary btn-sm">Create a case</Link></div>;
  return <div className="table-wrap"><table className="table"><thead><tr><th>Case</th><th>Supplier</th><th>Branch · date</th><th>Status</th><th>Est. value</th></tr></thead><tbody>{cases.map((item) => <tr key={item.id} data-testid={`row-case-${item.id}`}><td><Link href={`/cases/${item.id}`}><span className="case-id">{item.id}</span><span className="case-name" style={{ marginTop: 4 }}>{item.item} · {item.unit}</span></Link></td><td>{item.supplier}</td><td>{item.branch}<div className="case-sub" style={{ marginTop: 4 }}>{item.date}</div></td><td><StatusBadge status={item.status} /></td><td style={{ color: '#253f45', fontWeight: 700 }}>{money(Math.max(0, item.ordered - item.received) * item.unitCost, settings.currency)}</td></tr>)}</tbody></table></div>;
}

function StatusBadge({ status }: { status: Status }) {
  const className = status === 'Open' ? 'status-open' : status === 'Awaiting response' ? 'status-awaiting' : status === 'Resolved' ? 'status-resolved' : 'status-disputed';
  return <span className={`status ${className}`} data-testid={`status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

function Discrepancies({ cases, settings }: { cases: CaseRecord[]; settings: Settings }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [issue, setIssue] = useState('All issue types');
  const filtered = useMemo(() => cases.filter((item) => {
    const text = `${item.id} ${item.supplier} ${item.branch} ${item.item} ${item.po}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (status === 'All statuses' || item.status === status) && (issue === 'All issue types' || item.issue === issue);
  }), [cases, query, status, issue]);
  return <><div className="page-head"><div><div className="eyebrow">Receiving records</div><h1>Discrepancies</h1><p className="subtitle">Find a case, review its evidence, and keep the next step clear.</p></div><Link href="/cases/new" className="btn btn-primary" data-testid="button-new-case-list"><Plus size={16} />New discrepancy</Link></div>
    <section className="panel panel-pad">
      <div className="filters"><div className="searchbox"><Search size={16} /><input className="field" placeholder="Search cases, suppliers, items…" value={query} onChange={(event) => setQuery(event.target.value)} data-testid="input-search-cases" aria-label="Search cases" /></div>
        <select className="select" value={status} onChange={(event) => setStatus(event.target.value)} data-testid="filter-case-status" aria-label="Filter by status">{['All statuses','Open','Awaiting response','Disputed','Resolved'].map((value) => <option key={value}>{value}</option>)}</select>
        <select className="select" value={issue} onChange={(event) => setIssue(event.target.value)} data-testid="filter-issue-type" aria-label="Filter by issue type">{['All issue types','Short delivery','Damaged goods','Wrong item','Quality issue'].map((value) => <option key={value}>{value}</option>)}</select>
      </div>
      <div className="section-title" style={{ marginBottom: 10 }}><p style={{ margin: 0 }}>{filtered.length} {filtered.length === 1 ? 'case' : 'cases'} found</p><span style={{ display:'inline-flex',alignItems:'center',gap:6,color:'#84928f',fontSize:11 }}><ListFilter size={14} /> Filtered locally</span></div>
      <CaseTable cases={filtered} settings={settings} />
    </section>
  </>;
}

function NewCase({ settings, onCreate }: { settings: Settings; onCreate: (record: Omit<CaseRecord,'id'|'timeline'|'recovered'>) => void }) {
  const [supplier, setSupplier] = useState('');
  const [branch, setBranch] = useState(settings.branch);
  const [po, setPo] = useState('');
  const [date, setDate] = useState('23 Oct 2026');
  const [item, setItem] = useState('');
  const [unit, setUnit] = useState('');
  const [ordered, setOrdered] = useState('');
  const [received, setReceived] = useState('');
  const [issue, setIssue] = useState('Short delivery');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [error, setError] = useState('');
  const amount = Math.max(0, Number(ordered || 0) - Number(received || 0)) * Number(unitCost || 0);
  const attach = (fileList: FileList | null, kind: EvidenceFile['kind']) => {
    if (!fileList) return;
    setFiles((current) => [...current, ...Array.from(fileList).map((file) => ({ name: file.name, size: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`, kind }))]);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!supplier.trim() || !item.trim() || !ordered || !received || !unitCost) { setError('Add a supplier, item, both quantities, and unit cost to create this case.'); return; }
    onCreate({ supplier: supplier.trim(), branch, po: po.trim() || 'Not provided', date: date || shortDate(), item: item.trim(), unit: unit.trim() || 'unit', ordered: Number(ordered), received: Number(received), issue, unitCost: Number(unitCost), currency: settings.currency, notes, status: 'Open', files, });
  };
  return <><div className="page-head"><div><div className="eyebrow">New receiving record</div><h1>New discrepancy</h1><p className="subtitle">Record a delivery issue and prepare evidence for the supplier.</p></div><Link href="/discrepancies" className="btn btn-secondary" data-testid="button-cancel-new"><ArrowLeft size={15} />Back to cases</Link></div>
    <form onSubmit={submit} data-testid="form-new-case">
      <section className="panel form-section"><h2>Delivery information</h2><div className="form-grid">
        <Field label="Supplier" required><input className="field" placeholder="Supplier name" value={supplier} onChange={(e) => setSupplier(e.target.value)} data-testid="input-supplier" /></Field>
        <Field label="Branch" required><select className="select" value={branch} onChange={(e) => setBranch(e.target.value)} data-testid="select-branch">{[settings.branch,'Quezon City Branch','Cebu Branch'].filter((value,index,array)=>array.indexOf(value)===index).map((value)=><option key={value}>{value}</option>)}</select></Field>
        <Field label="PO reference"><input className="field" placeholder="e.g. KN-10482" value={po} onChange={(e) => setPo(e.target.value)} data-testid="input-po-reference" /></Field>
        <Field label="Delivery date"><input className="field" type="date" value={date === '23 Oct 2026' ? '2026-10-23' : date} onChange={(e) => setDate(e.target.value ? new Date(`${e.target.value}T12:00:00`).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '')} data-testid="input-delivery-date" /></Field>
      </div></section>
      <section className="panel form-section"><h2>Item details</h2><div className="form-grid">
        <Field label="Item" required><input className="field" placeholder="e.g. Full cream milk" value={item} onChange={(e) => setItem(e.target.value)} data-testid="input-item-name" /></Field>
        <Field label="Unit"><input className="field" placeholder="e.g. 6 × 1L case" value={unit} onChange={(e) => setUnit(e.target.value)} data-testid="input-item-unit" /></Field>
        <Field label="Quantity ordered" required><input className="field" type="number" min="0" placeholder="0" value={ordered} onChange={(e) => setOrdered(e.target.value)} data-testid="input-quantity-ordered" /></Field>
        <Field label="Quantity received" required><input className="field" type="number" min="0" placeholder="0" value={received} onChange={(e) => setReceived(e.target.value)} data-testid="input-quantity-received" /></Field>
        <Field label="Issue type"><select className="select" value={issue} onChange={(e) => setIssue(e.target.value)} data-testid="select-issue-type">{['Short delivery','Damaged goods','Wrong item','Quality issue','Billing mismatch'].map((v)=><option key={v}>{v}</option>)}</select></Field>
        <Field label={`Unit cost (${settings.currency})`} required><input className="field" type="number" min="0" step="0.01" placeholder="0.00" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} data-testid="input-unit-cost" /><small className="input-help">Excluding VAT</small></Field>
      </div><div className="money-box"><div><small>Estimated amount affected</small><span className="input-help">{Math.max(0,Number(ordered||0)-Number(received||0))} {unit || 'units'} × {money(Number(unitCost||0),settings.currency)} · Excluding VAT</span></div><strong data-testid="text-case-estimate">{money(amount,settings.currency)}</strong></div></section>
      <section className="panel form-section"><h2>Evidence & notes</h2><div className="form-grid">
        <div className="form-field"><label>Signed delivery receipt <span>Recommended</span></label><label className="btn btn-secondary" style={{ justifyContent:'flex-start', width:'fit-content' }}><Upload size={15} />Upload delivery receipt<input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={(e)=>attach(e.target.files,'receipt')} data-testid="upload-delivery-receipt" /></label></div>
        <div className="form-field"><label>Photo of delivered goods <span>Recommended</span></label><label className="btn btn-secondary" style={{ justifyContent:'flex-start', width:'fit-content' }}><ImagePlus size={15} />Add photo<input type="file" accept="image/*,.pdf" hidden onChange={(e)=>attach(e.target.files,'photo')} data-testid="upload-delivery-photo" /></label></div>
        <div className="form-field full"><div className="input-help">Files are listed in this local prototype only. Attach the originals separately when contacting a supplier.</div>{files.map((file,index)=><div className="file-row" key={`${file.name}-${index}`}><div className="file-info"><FileText size={16} color="#087e83" /><span>{file.name}<small>{file.size}</small></span></div><button type="button" className="icon-btn" aria-label={`Remove ${file.name}`} onClick={()=>setFiles((current)=>current.filter((_,i)=>i!==index))} data-testid={`remove-file-${index}`}><X size={14}/></button></div>)}</div>
        <Field label="Receiving notes" full><textarea className="textarea" placeholder="What did your receiving team observe?" value={notes} onChange={(e)=>setNotes(e.target.value)} data-testid="input-receiving-notes" /></Field>
      </div></section>
      {error && <div className="notice" role="alert" style={{ marginBottom: 12 }} data-testid="error-create-case">{error}</div>}
      <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}><Link href="/discrepancies" className="btn btn-secondary" data-testid="button-cancel-case">Cancel</Link><button className="btn btn-primary" type="submit" data-testid="button-create-case"><Check size={15} />Create case</button></div>
    </form>
  </>;
}

function Field({ label, children, required, full }: { label: string; children: ReactNode; required?: boolean; full?: boolean }) {
  return <div className={`form-field${full ? ' full' : ''}`}><label>{label}{required && <span> · Required</span>}</label>{children}</div>;
}

function CaseDetail({ cases, settings, onUpdate }: { cases: CaseRecord[]; settings: Settings; onUpdate: (id: string, change: Partial<CaseRecord>, event?: string) => void }) {
  const params = useParams<{ id: string }>();
  const item = cases.find((record) => record.id === params.id);
  const [recovery, setRecovery] = useState('');
  if (!item) return <MissingCase />;
  const shortfall = Math.max(0, item.ordered - item.received);
  const value = shortfall * item.unitCost;
  const currency = item.currency ?? 'PHP';
  const changeStatus = (status: Status) => onUpdate(item.id, { status }, 'Status updated');
  const recordRecovery = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(recovery);
    if (amount > 0) { onUpdate(item.id, { recovered: item.recovered + amount, status: item.recovered + amount >= value ? 'Resolved' : item.status }, 'Recovery recorded'); setRecovery(''); }
  };
  return <><div className="page-head"><div><div className="eyebrow">Case {item.id}</div><h1>{item.issue} — {item.po}</h1><p className="subtitle">{item.date} · {item.branch} · <StatusBadge status={item.status} /></p></div><Link href="/discrepancies" className="btn btn-secondary" data-testid="button-back-cases"><ArrowLeft size={15} />All cases</Link></div>
    <div className="two-col">
      <div style={{ display:'grid',gap:15 }}>
        <section className="panel panel-pad"><div className="section-title"><div><h2>Delivery summary</h2><p>What was expected and what arrived.</p></div><span className="case-id">{item.id}</span></div>
          <div className="detail-grid">{[['Supplier',item.supplier],['Branch',item.branch],['Purchase order',item.po],['Delivery date',item.date],['Item',`${item.item} · ${item.unit}`],['Issue type',item.issue]].map(([label,value])=><DataPair key={label} label={label} value={value} />)}</div>
          <div className="detail-grid" style={{ marginTop: 8 }}><DataPair label="Ordered" value={`${item.ordered} ${item.unit}`} /><DataPair label="Received" value={`${item.received} ${item.unit}`} /><DataPair label="Shortfall" value={`${shortfall} ${item.unit}`} /><DataPair label="Unit cost" value={`${money(item.unitCost,currency)} per ${item.unit}`} /></div>
          <div className="money-box"><div><small>Estimated amount affected</small><span className="input-help">{shortfall} {item.unit} × {money(item.unitCost,currency)} · Excluding VAT</span></div><strong data-testid={`text-estimate-${item.id}`}>{money(value,currency)}</strong></div>
          {item.notes && <div style={{ marginTop:16 }}><div className="eyebrow" style={{ marginBottom:7 }}>Receiving notes</div><p style={{ color:'#5c7274',fontSize:12,lineHeight:1.65,margin:0 }}>{item.notes}</p></div>}
        </section>
        <section className="panel panel-pad"><div className="section-title"><div><h2>Evidence checklist</h2><p>Supporting records for the supplier conversation.</p></div><span className="case-sub">{item.files.length} file{item.files.length === 1 ? '' : 's'} attached</span></div>
          <div className="check-row"><div className="check-icon">{item.files.some((f)=>f.kind==='receipt')?<Check size={14}/>:<FileCheck2 size={14}/>}</div><div><strong>Signed delivery receipt</strong><small>{item.files.find((f)=>f.kind==='receipt')?.name ?? 'A signed receipt makes it easy to verify what was accepted.'}</small></div>{item.files.some((f)=>f.kind==='receipt')&&<span className="status status-resolved">Attached</span>}</div>
          <div className="check-row"><div className="check-icon">{item.files.some((f)=>f.kind==='photo')?<Check size={14}/>:<ImagePlus size={14}/>}</div><div><strong>Receiving count photo</strong><small>{item.files.find((f)=>f.kind==='photo')?.name ?? 'Add a clear photo of the received boxes.'}</small></div>{item.files.some((f)=>f.kind==='photo')&&<span className="status status-resolved">Attached</span>}</div>
          {item.files.map((file,index)=><div className="file-row" key={`${file.name}-${index}`} data-testid={`file-evidence-${index}`}><div className="file-info"><FileText size={16} color="#087e83"/><span>{file.name}<small>{file.size}</small></span></div><span style={{ color:'#82918d',fontSize:10 }}>Local file record</span></div>)}
          {!item.files.length&&<div className="notice" style={{ marginTop:12 }}>No files attached yet. Start with the signed receipt and a clear photo of the delivered boxes.</div>}
        </section>
        <section className="panel panel-pad"><div className="section-title"><div><h2>Resolution</h2><p>Keep the supplier outcome visible on this case.</p></div></div>
          <div className="detail-grid"><DataPair label="Proposed resolution" value="Supplier credit" /><DataPair label="Recorded recovery" value={money(item.recovered,currency)} /></div>
          <form onSubmit={recordRecovery} style={{ display:'flex',gap:9,marginTop:12,flexWrap:'wrap' }}><input className="field" type="number" min="0" step="0.01" placeholder="Recovery amount" value={recovery} onChange={(e)=>setRecovery(e.target.value)} aria-label="Recovery amount" data-testid="input-recovery-amount" style={{ flex:'1 1 150px' }}/><button type="submit" className="btn btn-secondary" data-testid="button-record-recovery"><BadgeCheck size={15}/>Record recovery</button></form>
        </section>
      </div>
      <div style={{ display:'grid',gap:15,alignContent:'start' }}>
        <section className="panel panel-pad"><div className="section-title"><div><h2>Case status</h2><p>Update this case as the conversation moves.</p></div></div>
          <select className="select" value={item.status} onChange={(e)=>changeStatus(e.target.value as Status)} aria-label="Update case status" data-testid="select-update-status">{['Open','Awaiting response','Disputed','Resolved'].map((value)=><option key={value}>{value}</option>)}</select>
          <div style={{ marginTop:13 }}><Link href={`/cases/${item.id}/message`} className="btn btn-primary full-width" data-testid="button-generate-message"><MessageSquareText size={15}/>Prepare supplier message</Link></div>
        </section>
        <div className="notice"><strong>Before you share</strong><br />Review the quantities and requested credit. Supply Proof prepares the text; it does not send a message or attach files.</div>
        <section className="panel panel-pad"><div className="section-title"><div><h2>Timeline</h2><p>Notes on the case, from first count to resolution.</p></div></div>
          <div className="timeline">{item.timeline.map((event,index)=><div className="timeline-item" key={`${event.title}-${index}`} data-testid={`timeline-event-${index}`}><strong>{event.title}</strong><small>{event.date}</small><p>{event.detail}</p></div>)}</div>
        </section>
      </div>
    </div>
  </>;
}
function DataPair({ label, value }: { label: string; value: string }) { return <div className="data-pair"><label>{label}</label><strong>{value}</strong></div>; }

function MessagePage({ cases, settings, onFlash }: { cases: CaseRecord[]; settings: Settings; onFlash: (message: string) => void }) {
  const params = useParams<{ id: string }>();
  const item = cases.find((record) => record.id === params.id);
  if (!item) return <MissingCase />;
  const shortfall = Math.max(0, item.ordered - item.received);
  const value = shortfall * item.unitCost;
  const currency = item.currency ?? 'PHP';
  const message = `Good day, ${item.supplier.split(' ')[0]} team,\n\nWe would like to formally raise a delivery discrepancy under PO ${item.po}, received on ${item.date} at our ${item.branch}.\n\n${item.item} · ${item.unit}\nOrdered: ${item.ordered} ${item.unit}\nReceived: ${item.received} ${item.unit}\nShortfall: ${shortfall} ${item.unit}\n\nWe request a supplier credit of ${money(value,currency)} excluding VAT, or advice on when a replacement delivery can be arranged. Please quote ${item.id} in your reply.\n\n${item.notes || 'Our receiving team verified the count against the purchase order.'}\n\nThank you,\nMika Santos\nOperations Manager · ${settings.businessName}\n${settings.email}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(message); onFlash('Message copied. Nothing has been sent.'); }
    catch { const node = document.querySelector<HTMLTextAreaElement>('#copy-fallback'); if(node){node.select();document.execCommand('copy');onFlash('Message copied. Nothing has been sent.');} }
  };
  return <><div className="page-head"><div><div className="eyebrow">Case {item.id}</div><h1>Supplier message</h1><p className="subtitle">A clear summary of the delivery issue, ready to share with your supplier.</p></div><Link href={`/cases/${item.id}`} className="btn btn-secondary" data-testid="button-return-case"><ArrowLeft size={15}/>Back to case</Link></div>
    <div className="two-col">
      <div style={{ display:'grid',gap:14 }}>
        <section className="panel panel-pad"><div className="section-title"><div><h2>Message preview</h2><p>Not sent · review before you share.</p></div><span className="status status-open">Not sent</span></div><div className="message-preview" data-testid="text-message-preview">{message}</div><textarea id="copy-fallback" readOnly value={message} style={{ position:'fixed',left:'-9999px',top:0 }} aria-hidden="true" /></section>
        <button className="btn btn-primary full-width" onClick={copy} data-testid="button-copy-message"><Copy size={15}/>Copy message</button>
        <Link href={`/cases/${item.id}`} className="btn btn-secondary full-width" data-testid="button-back-to-case"><ArrowLeft size={15}/>Back to case</Link>
      </div>
      <div style={{ display:'grid',gap:14,alignContent:'start' }}>
        <section className="panel panel-pad"><div className="section-title"><div><h2>Before you share</h2><p>Review the details and requested credit.</p></div><ShieldCheck size={17} color="#087e83"/></div>
          <DataPair label="Supplier" value={item.supplier}/><DataPair label="Case" value={`${item.issue} — PO ${item.po} — ${item.id}`}/><DataPair label="Item" value={`${item.item} · ${item.unit} · ${item.branch}`}/><DataPair label="Quantity" value={`Ordered ${item.ordered} · received ${item.received} · shortfall ${shortfall}`}/><DataPair label="Estimated value" value={`${money(value,currency)} · excluding VAT`}/><DataPair label="Evidence" value={`${item.files.length} evidence file${item.files.length===1?'':'s'} attached`}/>
        </section>
        <div className="notice">Copy the message text and paste it into email or your preferred messaging app. Attach {item.files.length ? item.files.map((f)=>f.name).join(' and ') : 'your evidence files'} separately before sending. Copying does not close the case or record a recovery.</div>
      </div>
    </div>
  </>;
}

function SettingsPage({ settings, onSave }: { settings: Settings; onSave: (settings: Settings) => void }) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);
  const updateNotify = (key: keyof Settings['notifications']) => setDraft((prev)=>({...prev,notifications:{...prev.notifications,[key]:!prev.notifications[key]}}));
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(draft); };
  return <><div className="page-head"><div><div className="eyebrow">Workspace defaults</div><h1>Settings</h1><p className="subtitle">A few details to keep new cases consistent.</p></div></div>
    <form onSubmit={submit} className="settings-stack" data-testid="form-settings">
      <div className="workspace-summary"><div className="section-title" style={{ margin:0 }}><h2>Workspace & contact</h2><BriefcaseBusiness size={17} color="#087e83"/></div><div className="summary-line"><i/>Sample workspace · 3 branches · Philippines</div><div className="summary-line"><i/>Mika Santos · Operations manager</div></div>
      <section className="panel form-section" style={{ margin:0 }}><h2>Business details</h2><div className="form-grid">
        <Field label="Business name"><input className="field" value={draft.businessName} onChange={(e)=>setDraft({...draft,businessName:e.target.value})} data-testid="input-business-name"/></Field>
        <Field label="Default branch"><select className="select" value={draft.branch} onChange={(e)=>setDraft({...draft,branch:e.target.value})} data-testid="select-default-branch">{['Manila Branch','Quezon City Branch','Cebu Branch'].map((branch)=><option key={branch}>{branch}</option>)}</select></Field>
        <Field label="Contact email"><input className="field" type="email" value={draft.email} onChange={(e)=>setDraft({...draft,email:e.target.value})} data-testid="input-contact-email"/></Field>
        <Field label="Preferred currency"><select className="select" value={draft.currency} onChange={(e)=>setDraft({...draft,currency:e.target.value})} data-testid="select-currency"><option value="PHP">PHP — Philippine peso (₱)</option><option value="USD">USD — US dollar ($)</option><option value="SGD">SGD — Singapore dollar (S$)</option></select></Field>
      </div><div className="notice" style={{ marginTop:14 }}><strong>Defaults explanation</strong><br/>These defaults prefill new cases. Existing records keep their original branch, currency, and contact details.</div></section>
      <section className="panel form-section" style={{ margin:0 }}><h2>Notifications</h2>
        {([
          ['created','New discrepancies','Notify when a new case is created.'],
          ['status','Case status changes','Notify when a case moves to another status.'],
          ['recovery','Recorded recoveries','Notify when a recovery is recorded.'],
        ] as const).map(([key,title,desc])=><div className="notify-row" key={key}><div><strong>{title}</strong><small>{desc}</small></div><button type="button" className={`toggle${draft.notifications[key]?' on':''}`} aria-pressed={draft.notifications[key]} aria-label={`Toggle ${title}`} onClick={()=>updateNotify(key)} data-testid={`toggle-notification-${key}`}><span/></button></div>)}
        <p className="input-help" style={{ margin:'12px 0 0' }}>Notification preferences are saved locally in this prototype. No email notifications are sent.</p>
      </section>
      <button className="btn btn-primary full-width" type="submit" data-testid="button-save-settings"><Check size={15}/>Save changes</button>
    </form>
  </>;
}

function AuthPage({ signup, settings, onDone, onFlash }: { signup: boolean; settings: Settings; onDone: () => void; onFlash: (message: string) => void }) {
  const [email, setEmail] = useState(settings.email);
  const [password, setPassword] = useState('');
  const [business, setBusiness] = useState(settings.businessName);
  const [industry, setIndustry] = useState('Restaurant group');
  const submit = (event: FormEvent) => { event.preventDefault(); onFlash('Prototype workspace opened. This is not a real sign-in.'); onDone(); };
  return <div className="auth-page">
    <div className="auth-art"><img src="/assets/supplyproof-welcome.png" alt="Supply Proof delivery verification illustration"/><div className="auth-caption"><h2>Good deliveries should be easy to prove.</h2><p>Keep receiving notes, evidence, and supplier follow-ups together in one clear workspace.</p></div></div>
    <div className="auth-form-side"><div className="auth-card">
      <Link href="/" className="brand auth-brand" data-testid="link-auth-brand"><img src="/assets/supplyproof-mark.png" alt=""/><span>Supply Proof<small>Delivery, documented.</small></span></Link>
      <div className="eyebrow">Sample workspace · Philippines</div><h1>{signup ? 'Set up your workspace' : 'Welcome back'}</h1><p className="subtitle">{signup ? 'A few details to make your receiving records yours.' : 'Sign in to continue to your delivery records.'}</p>
      <form className="auth-fields" onSubmit={submit} data-testid={signup?'form-signup':'form-login'}>
        {signup&&<><Field label="Business name"><input className="field" value={business} onChange={(e)=>setBusiness(e.target.value)} required data-testid="input-signup-business"/></Field><Field label="Industry"><select className="select" value={industry} onChange={(e)=>setIndustry(e.target.value)} data-testid="select-signup-industry"><option>Restaurant group</option><option>Regional retail</option><option>Food service</option><option>Other</option></select></Field></>}
        <Field label="Email"><input className="field" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required data-testid="input-auth-email"/></Field>
        {signup&&<Field label="Contact name"><input className="field" placeholder="Your name" data-testid="input-contact-name"/></Field>}
        <Field label="Password"><input className="field" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={4} data-testid="input-auth-password"/></Field>
        <button className="btn btn-primary full-width" type="submit" data-testid="button-auth-submit">{signup?'Create sample workspace':'Sign in'} <ArrowRight size={15}/></button>
      </form>
      <div className="auth-bottom">{signup?'Already have a workspace?':'Need access? Ask your operations team for a workspace invite.'} {!signup&&<><br/><Link href="/signup" className="auth-link" data-testid="link-to-signup">Create a sample workspace</Link></>}</div>
      {signup&&<div className="auth-bottom"><Link href="/login" className="auth-link" data-testid="link-to-login">Back to sign in</Link></div>}
      <p className="input-help" style={{ textAlign:'center',marginTop:24 }}>Prototype access only — no account is created and no credentials are saved.</p>
    </div></div>
  </div>;
}

function MissingCase() { return <div className="panel panel-pad empty-state"><AlertCircle size={28}/><strong>Case not found</strong><p>This case may have been removed from the local prototype.</p><Link href="/discrepancies" className="btn btn-primary btn-sm">Back to discrepancies</Link></div>; }
function NotFound() { return <div className="panel panel-pad empty-state"><AlertCircle size={28}/><strong>Page not found</strong><p>That page is not part of this workspace.</p><Link href="/overview" className="btn btn-primary btn-sm">Go to overview</Link></div>; }

export default App;
