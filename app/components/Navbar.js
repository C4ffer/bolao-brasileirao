'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '../lib/actions';

export default function Navbar({ username }) {
  const pathname = usePathname();

  return (
    <nav className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', marginBottom: '32px' }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
        <span className="title-gradient">Bolão 2026</span>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? 'var(--primary)' : 'var(--text-main)', fontWeight: pathname === '/dashboard' ? 'bold' : 'normal', transition: 'var(--transition)' }}>
          Jogos
        </Link>
        <Link href="/ranking" style={{ color: pathname === '/ranking' ? 'var(--primary)' : 'var(--text-main)', fontWeight: pathname === '/ranking' ? 'bold' : 'normal', transition: 'var(--transition)' }}>
          Ranking
        </Link>
        
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--surface-border)' }}></div>
        
        <span style={{ color: 'var(--text-muted)' }}>{username}</span>
        
        <button 
          onClick={() => logoutAction()} 
          style={{ color: 'var(--danger)', fontSize: '0.9rem', padding: '6px 12px', border: '1px solid var(--danger)', borderRadius: '6px' }}
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
