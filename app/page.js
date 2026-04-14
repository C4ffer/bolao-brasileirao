'use client'

import { useActionState, useState } from 'react';
import { authAction } from './lib/actions';
import './page.css';

export default function Home() {
  const [state, formAction] = useActionState(authAction, { error: null });
  const [isRegister, setIsRegister] = useState(false);

  return (
    <main className="page-center">
      <div className="glass-panel login-card animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            Bolão 2026
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            O melhor bolão do Brasileirão para você e seus amigos.
          </p>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="hidden" name="isRegister" value={isRegister.toString()} />
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Usuário</label>
            <input 
              name="username" 
              type="text" 
              placeholder="Ex: lucas123" 
              className="input-field" 
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Senha</label>
            <input 
              name="password" 
              type="password" 
              placeholder="Sua senha secreta" 
              className="input-field" 
              required
            />
          </div>

          {state?.error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.9rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--danger)' }}>
              {state.error}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
            {isRegister ? 'Criar Conta' : 'Entrar no Bolão'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'underline' }}
          >
            {isRegister ? 'Já tenho uma conta. Quero entrar.' : 'Não tem conta? Registre-se aqui.'}
          </button>
        </div>
      </div>
    </main>
  );
}
