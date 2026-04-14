'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UpdateScoresButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/update-scores');
      if (res.ok) {
        // Force Next.js to refresh data from server
        router.refresh();
      } else {
        alert('Erro ao atualizar os pontos. Tente novamente.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro inesperado ao atualizar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleUpdate} 
      disabled={loading}
      className="btn-primary" 
      style={{ padding: '8px 16px', fontSize: '0.9rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
    >
      {loading ? 'Atualizando...' : 'Atualizar Pontos'}
    </button>
  );
}
