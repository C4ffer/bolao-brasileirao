import { redirect } from 'next/navigation';
import { getSession } from '../lib/auth';
import { prisma } from '../lib/prisma';
import Navbar from '../components/Navbar';

export default async function Ranking() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: {
      points: 'desc'
    },
    select: {
      id: true,
      username: true,
      points: true
    }
  });

  return (
    <div className="container">
      <Navbar username={session.username} />
      
      <main className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2>Ranking <span className="title-gradient">Geral</span></h2>
          <form action="/api/update-scores" method="GET">
             {/* Simples formulário para testar a chamada da API - ideal seria uma Server Action admin, mas deixei acessível para o grupo */}
             <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              Atualizar Pontos
             </button>
          </form>
        </div>

        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '16px 24px' }}>Posição</th>
                <th style={{ padding: '16px 24px' }}>Usuário</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 'bold', color: index === 0 ? 'var(--secondary)' : index === 1 ? '#eab308' : 'inherit' }}>
                    {index + 1}º
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {user.username} {user.id === session.id && <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' }}>Você</span>}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 'bold' }}>
                    {user.points} pts
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum jogador no ranking ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
