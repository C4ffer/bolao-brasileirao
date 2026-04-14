'use client'

import { useState } from 'react';
import { savePredictionAction } from '../lib/actions';

export default function PredictionCard({ match, userPrediction }) {
  const [homeScore, setHomeScore] = useState(userPrediction?.homeScore ?? '');
  const [awayScore, setAwayScore] = useState(userPrediction?.awayScore ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const matchDate = new Date(match.partida_data);
  const isLocked = Date.now() >= matchDate.getTime();
  
  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return;
    setLoading(true);
    await savePredictionAction(match.partida_id, homeScore, awayScore);
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <span>{match.local}</span>
        <span>
          {matchDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          {isLocked && <span style={{ color: 'var(--danger)', marginLeft: '8px' }}>• Fechado</span>}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        {/* Mandante */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
          <span style={{ fontWeight: '600' }}>{match.clube_casa.nome}</span>
          <img src={match.clube_casa.escudos['60x60']} alt={match.clube_casa.nome} width={40} height={40} />
        </div>

        {/* Palpites */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="number" 
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={isLocked}
            className="input-field" 
            style={{ width: '60px', textAlign: 'center', padding: '8px', fontSize: '1.2rem', fontWeight: 'bold' }} 
          />
          <span style={{ color: 'var(--text-muted)' }}>X</span>
          <input 
            type="number" 
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={isLocked}
            className="input-field" 
            style={{ width: '60px', textAlign: 'center', padding: '8px', fontSize: '1.2rem', fontWeight: 'bold' }} 
          />
        </div>

        {/* Visitante */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <img src={match.clube_visitante.escudos['60x60']} alt={match.clube_visitante.nome} width={40} height={40} />
          <span style={{ fontWeight: '600' }}>{match.clube_visitante.nome}</span>
        </div>
      </div>

      {!isLocked && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <button 
            onClick={handleSave} 
            disabled={loading || homeScore === '' || awayScore === ''}
            className="btn-primary"
            style={{ width: '200px' }}
          >
            {saved ? 'Salvo!' : loading ? 'Salvando...' : 'Salvar Palpite'}
          </button>
        </div>
      )}
      
      {/* Exibir o placar oficial caso exista (para o usuário ver) */}
      {(match.placar_oficial_mandante !== null) && (
        <div style={{ textAlign: 'center', color: 'var(--secondary)', fontWeight: 'bold', marginTop: '8px' }}>
          Placar Oficial: {match.placar_oficial_mandante} x {match.placar_oficial_visitante}
        </div>
      )}
    </div>
  );
}
